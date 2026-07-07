"""Admin portal endpoints — everything here requires ``is_admin``.

Backs the React Admin dashboard. Three areas:

  - ``GET    /api/admin/users``               all users + activity counts
  - ``GET    /api/admin/attractions``          full catalogue for the management table
  - ``POST   /api/admin/attractions``          create an attraction
  - ``PUT    /api/admin/attractions/<id>``     update an attraction
  - ``DELETE /api/admin/attractions/<id>``     delete (cascades interactions,
                                               feedback, itinerary items)
  - ``GET    /api/admin/analytics``            dashboard counts + most-viewed list
  - ``POST   /api/admin/attractions/upload-image``  upload a photo from disk
  - ``GET    /api/admin/attractions/uploads/<name>`` serve a stored photo

Attractions are the catalogue the recommender ranks and the RAG KB is built
from, so admin edits here flow straight into the AI features. ``category``
should stay within the known set (see routes/users.py INTEREST_OPTIONS) so user
interests keep joining onto categories — the admin UI offers exactly that set.
"""

import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from sqlalchemy import func

from ..extensions import db
from ..models import Attraction, ChatLog, Feedback, Interaction, User
from ..models.interaction import InteractionType
from .auth import require_admin
from .helpers import json_error

admin_bp = Blueprint("admin", __name__)

NAME_MAX_LEN = 200
CATEGORY_MAX_LEN = 80
IMAGE_URL_MAX_LEN = 500

# Formats accepted for attraction photo uploads (mirrors routes/images.py).
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
# Attraction photos live in their own subfolder of UPLOAD_FOLDER, separate
# from the landmark-recognition uploads in routes/images.py.
ATTRACTION_UPLOAD_SUBDIR = "attractions"


def _image_extension(filename):
    """Lower-cased extension without the dot, or '' when there isn't one."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

# How many attractions the analytics "most viewed" list returns.
MOST_VIEWED_LIMIT = 8


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@admin_bp.get("/users")
@require_admin
def list_users():
    """All users, newest first, each with interaction/review activity counts.

    Counts come from correlated scalar subqueries (not joins) so one user with
    many interactions can't multiply their feedback rows into a wrong count.
    """
    interactions_ct = (
        db.select(func.count(Interaction.id))
        .where(Interaction.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )
    feedback_ct = (
        db.select(func.count(Feedback.id))
        .where(Feedback.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )

    rows = db.session.execute(
        db.select(User, interactions_ct, feedback_ct).order_by(
            User.created_at.desc(), User.id.desc()
        )
    ).all()

    users = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": bool(user.is_admin),
            "role": "admin" if user.is_admin else "user",
            "preferences": user.preferences,
            "interactions_count": interactions,
            "feedback_count": feedback,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user, interactions, feedback in rows
    ]
    return jsonify({"users": users})


# ---------------------------------------------------------------------------
# Attractions CRUD
# ---------------------------------------------------------------------------

def _serialize_attraction(attraction, review_count=None):
    """Full attraction row for the management table + edit form."""
    data = {
        "id": attraction.id,
        "name": attraction.name,
        "description": attraction.description,
        "category": attraction.category,
        "latitude": attraction.latitude,
        "longitude": attraction.longitude,
        "image_url": attraction.image_url,
        "avg_rating": round(attraction.avg_rating, 2) if attraction.avg_rating else 0,
        "created_at": attraction.created_at.isoformat() if attraction.created_at else None,
    }
    if review_count is not None:
        data["review_count"] = review_count
    return data


def _coerce_coord(value, field, low, high):
    """Validate an optional latitude/longitude. Returns ``(float_or_None, error)``."""
    if value is None or value == "":
        return None, None
    # bool is an int subclass — reject it before the float() cast masks it.
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None, json_error(f"{field} must be a number.", 400)
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None, json_error(f"{field} must be a number.", 400)
    if number < low or number > high:
        return None, json_error(f"{field} must be between {low} and {high}.", 400)
    return number, None


def _validate_attraction_payload(body):
    """Validate a create/update body. Returns ``(clean_fields, error)``.

    All fields are validated together (full-object semantics): the form always
    submits the complete attraction, so partial updates aren't needed.
    """
    if not isinstance(body, dict):
        return None, json_error("Request body must be a JSON object.", 400)

    name = body.get("name")
    if not isinstance(name, str) or not name.strip():
        return None, json_error("name is required.", 400)
    name = name.strip()
    if len(name) > NAME_MAX_LEN:
        return None, json_error(
            f"name must be at most {NAME_MAX_LEN} characters.", 400
        )

    def optional_str(field, max_len):
        value = body.get(field)
        if value is None:
            return None, None
        if not isinstance(value, str):
            return None, json_error(f"{field} must be a string.", 400)
        value = value.strip()
        if not value:
            return None, None
        if max_len and len(value) > max_len:
            return None, json_error(
                f"{field} must be at most {max_len} characters.", 400
            )
        return value, None

    category, err = optional_str("category", CATEGORY_MAX_LEN)
    if err:
        return None, err
    description, err = optional_str("description", None)
    if err:
        return None, err
    image_url, err = optional_str("image_url", IMAGE_URL_MAX_LEN)
    if err:
        return None, err

    latitude, err = _coerce_coord(body.get("latitude"), "latitude", -90, 90)
    if err:
        return None, err
    longitude, err = _coerce_coord(body.get("longitude"), "longitude", -180, 180)
    if err:
        return None, err

    return {
        "name": name,
        "category": category,
        "description": description,
        "image_url": image_url,
        "latitude": latitude,
        "longitude": longitude,
    }, None


@admin_bp.get("/attractions")
@require_admin
def list_attractions():
    """Whole catalogue (no pagination — admin table wants everything), A→Z.

    Each row carries its review count so the table can show engagement without
    a per-row round-trip.
    """
    review_ct = (
        db.select(func.count(Feedback.id))
        .where(Feedback.attraction_id == Attraction.id)
        .correlate(Attraction)
        .scalar_subquery()
    )
    rows = db.session.execute(
        db.select(Attraction, review_ct).order_by(Attraction.name.asc())
    ).all()
    return jsonify(
        {
            "attractions": [
                _serialize_attraction(a, review_count=count) for a, count in rows
            ]
        }
    )


@admin_bp.post("/attractions")
@require_admin
def create_attraction():
    """Create an attraction. Body: ``{name, category?, description?, latitude?,
    longitude?, image_url?}``. Returns the new row, 201."""
    fields, error = _validate_attraction_payload(request.get_json(silent=True))
    if error:
        return error

    attraction = Attraction(**fields)
    db.session.add(attraction)
    db.session.commit()
    return jsonify({"attraction": _serialize_attraction(attraction, review_count=0)}), 201


@admin_bp.put("/attractions/<int:attraction_id>")
@require_admin
def update_attraction(attraction_id):
    """Replace an attraction's editable fields (same body as create)."""
    attraction = db.session.get(Attraction, attraction_id)
    if attraction is None:
        return json_error("Attraction not found.", 404)

    fields, error = _validate_attraction_payload(request.get_json(silent=True))
    if error:
        return error

    for key, value in fields.items():
        setattr(attraction, key, value)
    db.session.commit()

    review_count = db.session.scalar(
        db.select(func.count(Feedback.id)).where(
            Feedback.attraction_id == attraction.id
        )
    )
    return jsonify(
        {"attraction": _serialize_attraction(attraction, review_count=review_count)}
    )


@admin_bp.post("/attractions/upload-image")
@require_admin
def upload_attraction_image():
    """Upload a photo from the admin's PC/phone storage for an attraction.

    multipart/form-data with the file under field name ``image`` (jpg / jpeg /
    png / webp; bodies over ``MAX_CONTENT_LENGTH`` are rejected with 413).
    Returns ``{image_url}`` — a relative path the frontend resolves against
    the API origin and stores as the attraction's ``image_url`` on save.
    """
    file = request.files.get("image")
    if file is None or not file.filename:
        return json_error(
            'An image file is required (multipart field name "image").', 400
        )

    ext = _image_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        return json_error(f"Unsupported image type; use one of: {allowed}.", 400)

    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(
        current_app.config["UPLOAD_FOLDER"], ATTRACTION_UPLOAD_SUBDIR
    )
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    return jsonify(
        {"image_url": f"/api/admin/attractions/uploads/{filename}"}
    ), 201


@admin_bp.get("/attractions/uploads/<path:filename>")
def serve_attraction_upload(filename):
    """Serve a stored attraction photo so ``<img src>`` can render it.

    Deliberately unauthenticated: browsers can't attach the Firebase bearer
    token to image requests. Filenames are random 128-bit hex (unguessable),
    matching the approach in routes/images.py.
    """
    upload_dir = os.path.join(
        current_app.config["UPLOAD_FOLDER"], ATTRACTION_UPLOAD_SUBDIR
    )
    # send_from_directory guards against path traversal in ``filename``.
    return send_from_directory(upload_dir, filename)


@admin_bp.delete("/attractions/<int:attraction_id>")
@require_admin
def delete_attraction(attraction_id):
    """Delete an attraction. ORM cascades remove its interactions, feedback and
    itinerary items (users' trips silently lose this stop — acceptable for the
    admin catalogue tool)."""
    attraction = db.session.get(Attraction, attraction_id)
    if attraction is None:
        return json_error("Attraction not found.", 404)

    db.session.delete(attraction)
    db.session.commit()
    return jsonify({"deleted": attraction_id})


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@admin_bp.get("/analytics")
@require_admin
def analytics():
    """Dashboard numbers: headline totals + the most-viewed attractions.

    ``most_viewed`` counts only ``view`` interactions (likes/visits are separate
    signals); ordered desc, top MOST_VIEWED_LIMIT, ties broken by name so the
    chart is stable across reloads.
    """
    totals = {
        "users": db.session.scalar(db.select(func.count(User.id))),
        "attractions": db.session.scalar(db.select(func.count(Attraction.id))),
        "interactions": db.session.scalar(db.select(func.count(Interaction.id))),
        "chat_messages": db.session.scalar(db.select(func.count(ChatLog.id))),
        "feedback_count": db.session.scalar(db.select(func.count(Feedback.id))),
    }
    avg_rating = db.session.scalar(db.select(func.avg(Feedback.rating)))
    totals["avg_feedback_rating"] = (
        round(float(avg_rating), 2) if avg_rating is not None else None
    )

    view_ct = func.count(Interaction.id).label("views")
    most_viewed_rows = db.session.execute(
        db.select(Attraction.id, Attraction.name, Attraction.category, view_ct)
        .join(Interaction, Interaction.attraction_id == Attraction.id)
        .where(Interaction.interaction_type == InteractionType.view)
        .group_by(Attraction.id, Attraction.name, Attraction.category)
        .order_by(view_ct.desc(), Attraction.name.asc())
        .limit(MOST_VIEWED_LIMIT)
    ).all()

    most_viewed = [
        {
            "attraction_id": attraction_id,
            "name": name,
            "category": category,
            "views": views,
        }
        for attraction_id, name, category, views in most_viewed_rows
    ]

    return jsonify({"totals": totals, "most_viewed": most_viewed})
