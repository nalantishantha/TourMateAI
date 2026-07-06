"""Chat endpoints backing the Chat page.

The turn itself is a thin HTTP wrapper: all conversational logic — keyword
rules today, the real RAG chatbot later — lives behind
``services.ai_service.chatbot_reply()``, so swapping the mock for the real
implementation is a config flip (``USE_MOCK_AI``), not a change here.

What this module adds on top of the service call is persistence: every
exchange is stored as a ChatLogs row (message + response + suggested
attraction ids), which is what lets the Chat page restore the user's previous
conversation — cards included — when they come back.

The service returns ``suggested_attractions`` as bare ids (its contract); these
routes expand them into full serialized attractions so the frontend can render
the inline cards without a second round-trip.

Routes (registered under ``/api``):
  - ``POST   /api/chat``          auth: one chatbot turn (persisted)
  - ``GET    /api/chat/history``  auth: the user's stored conversation
  - ``DELETE /api/chat/history``  auth: clear the user's conversation
"""

from flask import Blueprint, current_app, g, jsonify, request

from ..extensions import db
from ..models import Attraction, ChatLog
from ..services.ai_service import chatbot_reply
from .attractions import _serialize_attraction
from .auth import require_auth
from .helpers import json_error

chat_bp = Blueprint("chat", __name__)

MAX_MESSAGE_LENGTH = 2000

# How many prior turns we forward to the chatbot — enough for conversational
# context without letting a long conversation bloat every request.
MAX_HISTORY_TURNS = 20

HISTORY_DEFAULT_LIMIT = 50
HISTORY_MAX_LIMIT = 200

_HISTORY_ROLES = ("user", "assistant")


def _source():
    """Which implementation answered — mirrors routes/recommendations.py."""
    return "mock" if current_app.config.get("USE_MOCK_AI", True) else "ai"


def _clean_history(raw):
    """Sanitize a client-sent ``conversation_history`` into service shape.

    Keeps only well-formed ``{"role": "user"|"assistant", "content": str}``
    turns (malformed entries are dropped, not rejected — history is advisory
    context, not user data we need to police) and caps the tail at
    ``MAX_HISTORY_TURNS``.
    """
    turns = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role in _HISTORY_ROLES and isinstance(content, str) and content.strip():
            turns.append({"role": role, "content": content})
    return turns[-MAX_HISTORY_TURNS:]


def _attractions_by_ids(ids, lookup=None):
    """Expand attraction ids into serialized dicts, preserving id order.

    Ids that no longer resolve (attraction deleted since the chat was logged)
    are silently skipped. Pass a prebuilt ``lookup`` (id -> serialized dict) to
    reuse one query across many rows.
    """
    if not ids:
        return []
    if lookup is None:
        rows = Attraction.query.filter(Attraction.id.in_(ids)).all()
        lookup = {a.id: _serialize_attraction(a) for a in rows}
    return [lookup[i] for i in ids if i in lookup]


def _serialize_chat_log(log, lookup=None):
    """Shape a ChatLog row for JSON (one user+assistant exchange)."""
    return {
        "id": log.id,
        "message": log.message,
        "response": log.response,
        "suggested_attractions": _attractions_by_ids(
            log.suggested_attractions or [], lookup
        ),
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@chat_bp.post("/chat")
@require_auth
def send_message():
    """One chatbot turn for the current user, saved to ChatLogs.

    Body:
      - ``message``               required non-empty string (<= 2000 chars)
      - ``conversation_history``  optional list of prior turns, each
                                  ``{"role": "user"|"assistant", "content": str}``

    Returns the assistant ``reply`` plus ``suggested_attractions`` expanded to
    full attraction objects, and the persisted exchange's id/timestamp.
    """
    body = request.get_json(silent=True) or {}

    message = body.get("message")
    if not isinstance(message, str) or not message.strip():
        return json_error("message is required and must be a non-empty string.", 400)
    message = message.strip()
    if len(message) > MAX_MESSAGE_LENGTH:
        return json_error(
            f"message must be at most {MAX_MESSAGE_LENGTH} characters.", 400
        )

    raw_history = body.get("conversation_history")
    if raw_history is not None and not isinstance(raw_history, list):
        return json_error("conversation_history must be a list.", 400)
    history = _clean_history(raw_history or [])

    result = chatbot_reply(g.current_user.id, message, history or None)

    log = ChatLog(
        user_id=g.current_user.id,
        message=message,
        response=result["reply"],
        suggested_attractions=result["suggested_attractions"],
    )
    db.session.add(log)
    db.session.commit()

    return (
        jsonify(
            {
                "reply": result["reply"],
                "suggested_attractions": _attractions_by_ids(
                    result["suggested_attractions"]
                ),
                "chat_log_id": log.id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "source": _source(),
            }
        ),
        201,
    )


@chat_bp.get("/chat/history")
@require_auth
def get_history():
    """The current user's stored conversation, oldest exchange first.

    Query params:
      - ``limit``  max exchanges to return (default 50, capped at 200); when the
                   log is longer, the **most recent** ``limit`` exchanges win.
    """
    raw_limit = request.args.get("limit", str(HISTORY_DEFAULT_LIMIT))
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError):
        return json_error("limit must be an integer.", 400)
    if limit < 1:
        return json_error("limit must be positive.", 400)
    limit = min(limit, HISTORY_MAX_LIMIT)

    # Newest-first + reverse = "the last N exchanges, in chronological order".
    rows = (
        ChatLog.query.filter_by(user_id=g.current_user.id)
        .order_by(ChatLog.id.desc())
        .limit(limit)
        .all()
    )
    rows.reverse()

    # One attraction query for the whole page of history, shared by every row.
    all_ids = {i for row in rows for i in (row.suggested_attractions or [])}
    lookup = {}
    if all_ids:
        attractions = Attraction.query.filter(Attraction.id.in_(all_ids)).all()
        lookup = {a.id: _serialize_attraction(a) for a in attractions}

    return jsonify(
        {"messages": [_serialize_chat_log(row, lookup) for row in rows]}
    )


@chat_bp.delete("/chat/history")
@require_auth
def clear_history():
    """Delete the current user's entire conversation. Returns the row count."""
    deleted = ChatLog.query.filter_by(user_id=g.current_user.id).delete()
    db.session.commit()
    return jsonify({"deleted": deleted})
