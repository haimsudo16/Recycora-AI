"""
Centralized application configuration.

All secrets/config are read from environment variables (via a local .env
file in development). Nothing sensitive is hard-coded here.

Note on architecture: this backend targets SQLite through Python's
built-in `sqlite3` module (see app/db.py) rather than an ORM, so it runs
with zero extra native dependencies. The data-access layer in db.py is
organized as a repository pattern with parameterized queries, which
keeps a future migration to Postgres (via psycopg2 + a thin dialect
swap) straightforward without touching route/service code.
"""
import os
from functools import lru_cache
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    APP_NAME: str = "RECYcORA AI"
    ENV: str = os.getenv("FLASK_ENV", "development")

    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "recycora.db")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "8"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads/waste_scans")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
