"""Attractions catalogue endpoints (list / detail / feedback).

Public reads (list + detail) let the frontend browse the seeded Sri Lankan
attractions; the feedback write is authenticated and, besides storing the
review, keeps the denormalised ``Attraction.avg_rating`` column fresh so the
list can sort by rating cheaply.

Routes (registered under ``/api``):
  - ``GET  /api/attractions``                      list + filter/search/sort/paginate
  - ``GET  /api/attractions/<id>``                 detail, avg rating computed live
  - ``POST /api/attractions/<id>/feedback``        auth: submit/update a rating
"""

import math
from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from ..extensions import db
from ..models import Attraction, Feedback
from .auth import require_auth
from .helpers import json_error

attractions_bp = Blueprint("attractions", __name__)

# Guard-rails for pagination so a caller can't ask for an unbounded page.
DEFAULT_PER_PAGE = 20
MAX_PER_PAGE = 100

# Whitelisted sort keys -> the column/ordering they map to.
SORT_OPTIONS = ("rating", "name")

RATING_MIN = 1
RATING_MAX = 5


def _serialize_attraction(attraction):
    """Shape an Attraction row for JSON (list + detail base)."""
    return {
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


def _serialize_feedback(feedback):
    """Shape a Feedback row for JSON."""
    return {
        "id": feedback.id,
        "user_id": feedback.user_id,
        "user_name": feedback.user.name if feedback.user else None,
        "attraction_id": feedback.attraction_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": feedback.created_at.isoformat() if feedback.created_at else None,
    }


def _recompute_avg_rating(attraction):
    """Refresh the denormalised ``avg_rating`` from the Feedback table.

    Called after a feedback write (inside the same transaction, post-flush) so
    the stored value the list endpoint sorts on stays in step with reality.
    """
    avg = db.session.scalar(
        db.select(func.avg(Feedback.rating)).where(
            Feedback.attraction_id == attraction.id
        )
    )
    attraction.avg_rating = round(float(avg), 2) if avg is not None else 0


@attractions_bp.get("/attractions")
def list_attractions():
    """List attractions with optional filtering, search, sort and pagination.

    Query params (all optional):
      - ``category``  exact category match (case-insensitive)
      - ``search``    substring match against name OR description
      - ``sort``      ``name`` (default, A→Z) or ``rating`` (highest first)
      - ``page``      1-based page number (default 1)
      - ``per_page``  items per page (default 20, capped at 100)
    """
    category = (request.args.get("category") or "").strip()
    search = (request.args.get("search") or "").strip()
    sort = (request.args.get("sort") or "name").strip().lower()

    if sort not in SORT_OPTIONS:
        return json_error(
            f"sort must be one of: {', '.join(SORT_OPTIONS)}.", 400
        )

    page, per_page, page_error = _parse_pagination()
    if page_error:
        return page_error

    query = Attraction.query
    if category:
        query = query.filter(func.lower(Attraction.category) == category.lower())
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Attraction.name.ilike(pattern),
                Attraction.description.ilike(pattern),
            )
        )

    if sort == "rating":
        # Highest rated first; stable tie-break on name so pages are deterministic.
        query = query.order_by(Attraction.avg_rating.desc(), Attraction.name.asc())
    else:  # "name"
        query = query.order_by(Attraction.name.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "attractions": [_serialize_attraction(a) for a in pagination.items],
            "pagination": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "total_pages": pagination.pages,
            },
        }
    )


@attractions_bp.get("/attractions/<int:attraction_id>")
def get_attraction(attraction_id):
    """Return one attraction, with its average rating computed live from Feedback."""
    attraction = db.session.get(Attraction, attraction_id)
    if attraction is None:
        return json_error("Attraction not found.", 404)

    avg, count = db.session.execute(
        db.select(func.avg(Feedback.rating), func.count(Feedback.id)).where(
            Feedback.attraction_id == attraction_id
        )
    ).one()

    recent = (
        Feedback.query.filter_by(attraction_id=attraction_id)
        .order_by(Feedback.created_at.desc())
        .limit(10)
        .all()
    )

    data = _serialize_attraction(attraction)
    data["avg_rating"] = round(float(avg), 2) if avg is not None else 0
    data["rating_count"] = count
    data["reviews"] = [_serialize_feedback(f) for f in recent]
    return jsonify({"attraction": data})


def _haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth in km."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@attractions_bp.get("/attractions/<int:attraction_id>/nearby")
@require_auth
def get_nearby_attractions(attraction_id):
    """Return nearby attractions (within 40km), blended with recommendation scores."""
    attraction = db.session.get(Attraction, attraction_id)
    if attraction is None:
        return json_error("Attraction not found.", 404)

    # 1. Fetch all other attractions
    all_others = Attraction.query.filter(Attraction.id != attraction_id).all()
    
    # 2. Filter by distance <= 40km
    nearby = []
    for other in all_others:
        dist = _haversine(attraction.latitude, attraction.longitude, other.latitude, other.longitude)
        if dist <= 40.0:
            nearby.append((other, dist))
            
    if not nearby:
        return jsonify({"attractions": []})

    # 3. Get personalized recommendations to boost scores
    # get_recommendations returns a list of dicts with 'id' and 'score'
    from ..services.ai_service import get_recommendations
    user_id = g.current_user.id if hasattr(g, 'current_user') and g.current_user else None
    recs = get_recommendations(user_id, limit=50) if user_id else []
    
    # Create a lookup for recommendation scores (default 0)
    rec_scores = {r["id"]: r.get("score", 0.0) for r in recs}
    
    # 4. Score and sort the nearby locations
    # Lower distance is better. Higher rec score is better.
    # Score formula: rec_score - (distance / 40.0) -> maximizes at (high rec, low dist)
    results = []
    for other, dist in nearby:
        rec_score = rec_scores.get(other.id, 0.0)
        # Normalize distance to 0-1 (where 0 is 0km, 1 is 40km)
        dist_norm = dist / 40.0
        # Final blended score
        blended_score = rec_score - dist_norm
        results.append({
            "attraction": other,
            "distance": round(dist, 1),
            "blended_score": blended_score
        })
        
    # Sort descending by blended score
    results.sort(key=lambda x: x["blended_score"], reverse=True)
    
    # 5. Return top 4
    top_results = results[:4]
    
    out = []
    for res in top_results:
        data = _serialize_attraction(res["attraction"])
        data["distance_km"] = res["distance"]
        out.append(data)

    return jsonify({"attractions": out})


@attractions_bp.post("/attractions/<int:attraction_id>/feedback")
@require_auth
def submit_feedback(attraction_id):
    """Submit (or update) the current user's rating + comment for an attraction.

    Body: ``{ "rating": 1-5 (required int), "comment": "..." (optional str) }``.
    One review per user per attraction: re-posting updates the existing row.
    Returns 201 on first review, 200 on update.
    """
    attraction = db.session.get(Attraction, attraction_id)
    if attraction is None:
        return json_error("Attraction not found.", 404)

    body = request.get_json(silent=True) or {}
    rating = body.get("rating")
    comment = body.get("comment")

    # bool is a subclass of int in Python — reject True/False masquerading as a rating.
    if not isinstance(rating, int) or isinstance(rating, bool):
        return json_error("rating is required and must be an integer.", 400)
    if rating < RATING_MIN or rating > RATING_MAX:
        return json_error(
            f"rating must be between {RATING_MIN} and {RATING_MAX}.", 400
        )
    if comment is not None and not isinstance(comment, str):
        return json_error("comment must be a string.", 400)

    existing = Feedback.query.filter_by(
        user_id=g.current_user.id, attraction_id=attraction_id
    ).first()
    if existing:
        existing.rating = rating
        existing.comment = comment
        feedback = existing
        status = 200
    else:
        feedback = Feedback(
            user_id=g.current_user.id,
            attraction_id=attraction_id,
            rating=rating,
            comment=comment,
        )
        db.session.add(feedback)
        status = 201

    db.session.flush()  # assign feedback.id and make the row visible to the aggregate
    _recompute_avg_rating(attraction)
    db.session.commit()

    return (
        jsonify(
            {
                "feedback": _serialize_feedback(feedback),
                "attraction_avg_rating": attraction.avg_rating,
            }
        ),
        status,
    )


def _parse_pagination():
    """Read + validate ``page``/``per_page``. Returns ``(page, per_page, error)``.

    ``error`` is a Flask response tuple (present only on invalid input); when it
    is truthy the caller should return it immediately.
    """
    raw_page = request.args.get("page", "1")
    raw_per_page = request.args.get("per_page", str(DEFAULT_PER_PAGE))
    try:
        page = int(raw_page)
        per_page = int(raw_per_page)
    except (TypeError, ValueError):
        return None, None, json_error("page and per_page must be integers.", 400)

    if page < 1 or per_page < 1:
        return None, None, json_error("page and per_page must be positive.", 400)

    return page, min(per_page, MAX_PER_PAGE), None
