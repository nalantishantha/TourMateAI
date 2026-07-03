"""Environment-driven Flask configuration.

Loads a repo-root `.env` (and an optional `backend/.env` override), then builds
the SQLAlchemy MySQL connection URI from the `DB_*` variables documented in
`.env.example`.
"""

import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[1]   # backend/
_REPO_ROOT = _BACKEND_DIR.parent                     # repo root

# Repo-root .env first, then backend/.env (the latter overrides if present).
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")

    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "3306")
    DB_NAME = os.environ.get("DB_NAME", "tourmateai")

    # quote_plus so passwords with special characters don't corrupt the URI.
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
