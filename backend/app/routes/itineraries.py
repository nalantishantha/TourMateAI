"""Itinerary endpoints — trip plans and their day-by-day items.

An itinerary is a titled trip with optional start/end dates; its items are
attractions pinned to a day (``day_number``, 1-based) in a user-chosen order
(``order_index``). The planner UI groups items by day, so every read returns
items already sorted by (day_number, order_index) — the model's relationship
ordering guarantees that.

All routes operate on the **current user's** itineraries only; asking for
someone else's (or a missing) itinerary is a plain 404 so ids don't leak.

Routes (registered under ``/api``):
  - ``GET    /api/itineraries``                     auth: my itineraries, newest first
  - ``POST   /api/itineraries``                     auth: create a trip
  - ``GET    /api/itineraries/<id>``                auth: one trip, items included
  - ``PUT    /api/itineraries/<id>``                auth: update title/dates
  - ``DELETE /api/itineraries/<id>``                auth: delete trip + items
  - ``POST   /api/itineraries/<id>/items``          auth: add an attraction to a day
  - ``PUT    /api/itineraries/<id>/items/reorder``  auth: reorder one day's items
  - ``DELETE /api/itineraries/<id>/items/<item_id>`` auth: remove an item
"""

from datetime import date

from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import Attraction, Itinerary, ItineraryItem
from .attractions import _serialize_attraction
from .auth import require_auth
from .helpers import json_error

itineraries_bp = Blueprint("itineraries", __name__)

# How many attraction names to include as a per-itinerary teaser.
PREVIEW_STOPS = 3

MAX_TITLE_LENGTH = 200
MAX_TRIP_DAYS = 60  # sanity cap; nobody plans a 200-day trip in this UI


def _serialize_itinerary(itinerary):
    """Shape an Itinerary for JSON list views.

    Carries an item count + first few attraction names so the Dashboard can
    render a meaningful card without a second round-trip per itinerary.
    ``items`` is already ordered by (day_number, order_index) — see the model.
    """
    stops = [
        item.attraction.name
        for item in itinerary.items[:PREVIEW_STOPS]
        if item.attraction
    ]
    return {
        "id": itinerary.id,
        "title": itinerary.title,
        "start_date": itinerary.start_date.isoformat() if itinerary.start_date else None,
        "end_date": itinerary.end_date.isoformat() if itinerary.end_date else None,
        "created_at": itinerary.created_at.isoformat() if itinerary.created_at else None,
        "item_count": len(itinerary.items),
        "preview_stops": stops,
    }


def _serialize_item(item):
    """Shape an ItineraryItem for JSON, attraction expanded for direct render."""
    return {
        "id": item.id,
        "attraction_id": item.attraction_id,
        "day_number": item.day_number,
        "order_index": item.order_index,
        "notes": item.notes,
        "attraction": _serialize_attraction(item.attraction) if item.attraction else None,
    }


def _serialize_itinerary_detail(itinerary):
    """List shape + the full ordered item list (the Builder page's payload)."""
    data = _serialize_itinerary(itinerary)
    data["items"] = [_serialize_item(item) for item in itinerary.items]
    return data


def _get_owned_itinerary(itinerary_id):
    """The current user's itinerary by id, or None (missing OR not theirs)."""
    return Itinerary.query.filter_by(
        id=itinerary_id, user_id=g.current_user.id
    ).first()


def _day_count(itinerary):
    """Days in the trip, or None when either date is missing."""
    if itinerary.start_date and itinerary.end_date:
        return (itinerary.end_date - itinerary.start_date).days + 1
    return None


def _parse_date_field(body, field):
    """Read an optional ISO ``YYYY-MM-DD`` date from the JSON body.

    Returns ``(provided, value, error)`` — ``provided`` distinguishes "field
    absent" from an explicit ``null`` (which clears the date).
    """
    if field not in body:
        return False, None, None
    raw = body[field]
    if raw is None:
        return True, None, None
    if isinstance(raw, str):
        try:
            return True, date.fromisoformat(raw), None
        except ValueError:
            pass
    return True, None, json_error(f"{field} must be a YYYY-MM-DD date.", 400)


def _validate_dates(start, end):
    """Cross-field date rules shared by create + update. Returns an error or None."""
    if start and end:
        if end < start:
            return json_error("end_date cannot be before start_date.", 400)
        if (end - start).days + 1 > MAX_TRIP_DAYS:
            return json_error(f"Trips are capped at {MAX_TRIP_DAYS} days.", 400)
    return None


def _clean_title(raw):
    """Validated trip title or ``(None, error)``."""
    if not isinstance(raw, str) or not raw.strip():
        return None, json_error("title is required and must be a non-empty string.", 400)
    title = raw.strip()
    if len(title) > MAX_TITLE_LENGTH:
        return None, json_error(
            f"title must be at most {MAX_TITLE_LENGTH} characters.", 400
        )
    return title, None


# =============================================================================
# Itineraries
# =============================================================================

@itineraries_bp.get("/itineraries")
@require_auth
def list_itineraries():
    """Return the current user's itineraries, newest first."""
    rows = (
        Itinerary.query.filter_by(user_id=g.current_user.id)
        .order_by(Itinerary.created_at.desc())
        .all()
    )
    return jsonify({"itineraries": [_serialize_itinerary(i) for i in rows]})


@itineraries_bp.post("/itineraries")
@require_auth
def create_itinerary():
    """Create a trip. Body: ``title`` (required), ``start_date``/``end_date``
    (optional ISO dates; when both present, end >= start)."""
    body = request.get_json(silent=True) or {}

    title, error = _clean_title(body.get("title"))
    if error:
        return error

    _, start, error = _parse_date_field(body, "start_date")
    if error:
        return error
    _, end, error = _parse_date_field(body, "end_date")
    if error:
        return error
    error = _validate_dates(start, end)
    if error:
        return error

    itinerary = Itinerary(
        user_id=g.current_user.id, title=title, start_date=start, end_date=end
    )
    db.session.add(itinerary)
    db.session.commit()
    return jsonify({"itinerary": _serialize_itinerary_detail(itinerary)}), 201


@itineraries_bp.get("/itineraries/<int:itinerary_id>")
@require_auth
def get_itinerary(itinerary_id):
    """One itinerary with its full ordered item list."""
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)
    return jsonify({"itinerary": _serialize_itinerary_detail(itinerary)})


@itineraries_bp.put("/itineraries/<int:itinerary_id>")
@require_auth
def update_itinerary(itinerary_id):
    """Update title and/or dates. Only fields present in the body change;
    an explicit ``null`` clears a date.

    If the new dates shrink the trip, items stranded past the last day are
    pulled onto the final day (appended after its existing items) rather than
    silently orphaned.
    """
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)

    body = request.get_json(silent=True) or {}

    if "title" in body:
        title, error = _clean_title(body.get("title"))
        if error:
            return error
        itinerary.title = title

    start_given, start, error = _parse_date_field(body, "start_date")
    if error:
        return error
    end_given, end, error = _parse_date_field(body, "end_date")
    if error:
        return error

    new_start = start if start_given else itinerary.start_date
    new_end = end if end_given else itinerary.end_date
    error = _validate_dates(new_start, new_end)
    if error:
        return error
    itinerary.start_date = new_start
    itinerary.end_date = new_end

    days = _day_count(itinerary)
    if days is not None:
        stranded = [
            item for item in itinerary.items
            if item.day_number and item.day_number > days
        ]
        if stranded:
            tail = max(
                (i.order_index or 0 for i in itinerary.items
                 if i.day_number == days),
                default=-1,
            )
            for offset, item in enumerate(stranded, start=1):
                item.day_number = days
                item.order_index = tail + offset

    db.session.commit()
    return jsonify({"itinerary": _serialize_itinerary_detail(itinerary)})


@itineraries_bp.delete("/itineraries/<int:itinerary_id>")
@require_auth
def delete_itinerary(itinerary_id):
    """Delete a trip; its items go with it (cascade)."""
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)
    db.session.delete(itinerary)
    db.session.commit()
    return jsonify({"deleted": itinerary_id})


# =============================================================================
# Items
# =============================================================================

@itineraries_bp.post("/itineraries/<int:itinerary_id>/items")
@require_auth
def add_item(itinerary_id):
    """Add an attraction to a day. Body: ``attraction_id``, ``day_number``
    (1-based; must fit inside the trip's dates when those are set). The item
    lands at the end of that day."""
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)

    body = request.get_json(silent=True) or {}

    attraction_id = body.get("attraction_id")
    if not isinstance(attraction_id, int):
        return json_error("attraction_id is required and must be an integer.", 400)
    attraction = db.session.get(Attraction, attraction_id)
    if not attraction:
        return json_error("Attraction not found.", 404)

    day_number = body.get("day_number")
    if not isinstance(day_number, int) or day_number < 1:
        return json_error("day_number is required and must be a positive integer.", 400)
    days = _day_count(itinerary)
    if days is not None and day_number > days:
        return json_error(f"day_number is outside this trip ({days} days).", 400)

    tail = max(
        (i.order_index or 0 for i in itinerary.items if i.day_number == day_number),
        default=-1,
    )
    item = ItineraryItem(
        itinerary_id=itinerary.id,
        attraction_id=attraction_id,
        day_number=day_number,
        order_index=tail + 1,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": _serialize_item(item)}), 201


@itineraries_bp.put("/itineraries/<int:itinerary_id>/items/reorder")
@require_auth
def reorder_items(itinerary_id):
    """Set one day's item order. Body: ``day_number``, ``item_ids`` — the
    complete new order for that day. Every id must belong to this itinerary;
    listed items are (re)assigned to the day, so this also moves an item in
    from another day when the client allows cross-day drags."""
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)

    body = request.get_json(silent=True) or {}

    day_number = body.get("day_number")
    if not isinstance(day_number, int) or day_number < 1:
        return json_error("day_number is required and must be a positive integer.", 400)

    item_ids = body.get("item_ids")
    if not isinstance(item_ids, list) or not all(
        isinstance(i, int) for i in item_ids
    ):
        return json_error("item_ids must be a list of integers.", 400)
    if len(set(item_ids)) != len(item_ids):
        return json_error("item_ids contains duplicates.", 400)

    by_id = {item.id: item for item in itinerary.items}
    unknown = [i for i in item_ids if i not in by_id]
    if unknown:
        return json_error(f"Items not in this itinerary: {unknown}.", 400)

    for position, item_id in enumerate(item_ids):
        by_id[item_id].day_number = day_number
        by_id[item_id].order_index = position

    db.session.commit()
    # Session state is current; re-serialize through a fresh ordered read.
    db.session.refresh(itinerary)
    return jsonify({"itinerary": _serialize_itinerary_detail(itinerary)})


@itineraries_bp.delete("/itineraries/<int:itinerary_id>/items/<int:item_id>")
@require_auth
def remove_item(itinerary_id, item_id):
    """Remove one item from the trip."""
    itinerary = _get_owned_itinerary(itinerary_id)
    if not itinerary:
        return json_error("Itinerary not found.", 404)

    item = next((i for i in itinerary.items if i.id == item_id), None)
    if not item:
        return json_error("Item not found in this itinerary.", 404)

    db.session.delete(item)
    db.session.commit()
    return jsonify({"deleted": item_id})
