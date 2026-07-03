"""Flask application factory.

⚠️ PLACEHOLDER (Phase 0.5, owned long-term by the Web Developer).

This is a deliberately minimal factory so the AI package can be exercised
standalone during development (`python run.py`). The teammate's real factory —
config, SQLAlchemy, Firebase auth, web/business routes, services — replaces this
at integration (Phase 6). Keep this thin so that merge is clean; do not grow
web-side concerns here.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from .ai import ai_bp


def create_app():
    app = Flask(__name__)
    CORS(app)  # dev-only: allow the Vite dev server to call the API.

    # Mount the AI package. Real app factory will register web routes too.
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "tourmateai-backend"})

    return app
