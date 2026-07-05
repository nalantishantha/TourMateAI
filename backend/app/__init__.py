"""Flask application factory.

Creates the app, loads config, initialises the database + migrations, and mounts
blueprints. The AI package (`app.ai`) is mounted at `/api/ai/*` and stays behind
the JSON contracts in docs/api-contract.md — do not reach across that boundary.

Note: config/models/migrations here are the Web dev's area (built on their behalf
while they were unavailable — see backend/README.md ownership map).
"""

from flask import Flask, jsonify
from flask_cors import CORS

from .ai import ai_bp
from .config import Config
from .extensions import db, migrate
from .routes.auth import auth_bp
from .seed import register_cli


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)  # dev-only: allow the Vite dev server to call the API.

    # Database + migrations.
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models so their metadata is registered (needed for Alembic autogen).
    from . import models  # noqa: F401

    # Blueprints.
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")

    # CLI commands (flask seed-db).
    register_cli(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "tourmateai-backend"})

    return app
