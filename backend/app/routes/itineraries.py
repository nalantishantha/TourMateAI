"""Itinerary endpoints — read side only for now.

The Dashboard's "Continue planning" section needs the current user's saved
trip plans; full itinerary CRUD (create/edit/reorder days) lands with the
planner feature and will extend this blueprint.

Routes (registered under ``/api``):
  - ``GET /api/itineraries``   auth: the current user's itineraries, newest first
"""

from flask import Blueprint, g, jsonify

from ..models import Itinerary
from .auth import require_auth

itineraries_bp = Blueprint("itineraries", __name__)

# How many attraction names to include as a per-itinerary teaser.
PREVIEW_STOPS = 3


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
