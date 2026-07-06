"""Placeholder recommendations endpoint backing the Dashboard's
"Recommended for you" section.

This is NOT the recommendation engine. It is a deliberately simple,
honest-shaped stand-in: filter attractions by the user's stored interest
preferences (``User.preferences.interests`` values equal ``Attraction.category``
values by design — see routes/users.py), rank by rating, and top up with
popular attractions when interests are missing or too narrow.

The response mirrors ``POST /api/ai/recommend`` (docs/api-contract.md) —
each item carries ``score`` + ``reason`` alongside the full attraction fields
the cards need — so swapping in the real engine (Feature 3.x) is a one-line
change in the frontend service, not a reshape. ``"source": "mock"`` marks the
placeholder explicitly.

Routes (registered under ``/api``):
  - ``GET /api/recommendations/mock``   auth: interest-filtered attraction picks
"""

from flask import Blueprint, g, jsonify, request

from ..models import Attraction
from .attractions import _serialize_attraction
from .auth import require_auth
from .helpers import json_error

recommendations_bp = Blueprint("recommendations", __name__)

DEFAULT_LIMIT = 8
MAX_LIMIT = 24


def _score(attraction, matched_interest):
    """Deterministic pseudo-score in (0, 1): rating-driven, interest-boosted.

    Unrated attractions are treated as middling (3/5) rather than zero so a
    fresh catalogue still produces sensible ordering.
    """
    rating = attraction.avg_rating or 3.0
    base = 0.5 + (rating / 5.0) * 0.35  # 0.5 .. 0.85
    if matched_interest:
        base += 0.12
    return round(min(base, 0.99), 2)


def _serialize_recommendation(attraction, matched_interest):
    data = _serialize_attraction(attraction)
    data["score"] = _score(attraction, matched_interest)
    data["reason"] = (
        f"Matches your interest in {matched_interest}"
        if matched_interest
        else "Popular with travelers across Sri Lanka"
    )
    return data


@recommendations_bp.get("/recommendations/mock")
@require_auth
def mock_recommendations():
    """Interest-filtered attraction picks for the current user.

    Query params:
      - ``limit``  max items to return (default 8, capped at 24)

    Attractions in the user's interest categories come first (highest rated
    first); if that yields fewer than ``limit`` (including the no-preferences
    case), top-rated attractions from other categories fill the remainder.
    """
    raw_limit = request.args.get("limit", str(DEFAULT_LIMIT))
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError):
        return json_error("limit must be an integer.", 400)
    if limit < 1:
        return json_error("limit must be positive.", 400)
    limit = min(limit, MAX_LIMIT)

    prefs = g.current_user.preferences or {}
    interests = [i for i in (prefs.get("interests") or []) if isinstance(i, str)]

    by_rating = (Attraction.avg_rating.desc(), Attraction.name.asc())

    matched = []
    if interests:
        matched = (
            Attraction.query.filter(Attraction.category.in_(interests))
            .order_by(*by_rating)
            .limit(limit)
            .all()
        )

    recommendations = [_serialize_recommendation(a, a.category) for a in matched]

    if len(matched) < limit:
        fill_query = Attraction.query
        if matched:
            fill_query = fill_query.filter(
                Attraction.id.notin_([a.id for a in matched])
            )
        fillers = fill_query.order_by(*by_rating).limit(limit - len(matched)).all()
        recommendations.extend(_serialize_recommendation(a, None) for a in fillers)

    return jsonify({"recommendations": recommendations, "source": "mock"})
