"""
Data-access layer (repository pattern) on top of Python's built-in
`sqlite3` module.

Why sqlite3 directly instead of an ORM: it ships with the Python
standard library, so the project has zero extra native/binary
dependencies to install. Every query is parameterized (no string
interpolation of user input), which is what actually protects against
SQL injection - an ORM is a convenience layer on top of the same
guarantee, not a prerequisite for it. Swapping the storage engine to
PostgreSQL later means changing `get_connection()` (e.g. to psycopg2)
and the `?` placeholders to `%s`; every function in this module has a
narrow, table-scoped responsibility so that swap stays localized.
"""
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_settings

settings = get_settings()
_local = threading.local()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    organization_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    eco_points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS waste_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    image_path TEXT NOT NULL,
    detected_object TEXT NOT NULL,
    detected_category TEXT NOT NULL,
    material TEXT NOT NULL,
    confidence REAL NOT NULL,
    recyclability TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    environmental_insight TEXT,
    model_version TEXT NOT NULL DEFAULT 'heuristic-cv-v1',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_scans_user ON waste_scans(user_id);
CREATE INDEX IF NOT EXISTS ix_scans_created ON waste_scans(created_at);

CREATE TABLE IF NOT EXISTS waste_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    recycled INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    department TEXT,
    date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_records_user ON waste_records(user_id);
CREATE INDEX IF NOT EXISTS ix_records_date ON waste_records(date);
CREATE INDEX IF NOT EXISTS ix_records_category ON waste_records(category);

CREATE TABLE IF NOT EXISTS recycling_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    accepted_materials TEXT NOT NULL,
    contact TEXT,
    operating_hours TEXT,
    rating REAL NOT NULL DEFAULT 4.5,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_centers_city ON recycling_centers(city);

CREATE TABLE IF NOT EXISTS sustainability_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    recycling_score INTEGER NOT NULL,
    reduction_score INTEGER NOT NULL,
    consistency_score INTEGER NOT NULL,
    disposal_score INTEGER NOT NULL,
    calculated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_scores_user ON sustainability_scores(user_id);

CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_recs_user ON recommendations(user_id);

CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    points_required INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'award'
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    earned_at TEXT NOT NULL,
    UNIQUE(user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS ix_user_ach_user ON user_achievements(user_id);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = getattr(_local, "conn", None)
    if conn is None:
        db_path = Path(settings.DATABASE_PATH)
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        _local.conn = conn
    return conn


@contextmanager
def get_cursor(commit: bool = False):
    conn = get_connection()
    cur = conn.cursor()
    try:
        yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return dict(row)


def rows_to_dicts(rows) -> list[dict]:
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------

def create_user(name: str, email: str, password_hash: str, role: str = "user",
                 organization_name: str | None = None) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, role, organization_name, is_active, eco_points, created_at) "
            "VALUES (?, ?, ?, ?, ?, 1, 0, ?)",
            (name, email, password_hash, role, organization_name, now_iso()),
        )
        user_id = cur.lastrowid
    return get_user_by_id(user_id)


def get_user_by_email(email: str) -> dict | None:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        return row_to_dict(cur.fetchone())


def get_user_by_id(user_id: int) -> dict | None:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return row_to_dict(cur.fetchone())


def list_users() -> list[dict]:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM users ORDER BY created_at DESC")
        return rows_to_dicts(cur.fetchall())


def count_users() -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) as c FROM users")
        return cur.fetchone()["c"]


def count_users_by_role() -> dict:
    with get_cursor() as cur:
        cur.execute("SELECT role, COUNT(*) as c FROM users GROUP BY role")
        return {r["role"]: r["c"] for r in cur.fetchall()}


def add_eco_points(user_id: int, points: int):
    with get_cursor(commit=True) as cur:
        cur.execute("UPDATE users SET eco_points = eco_points + ? WHERE id = ?", (points, user_id))


def set_user_active(user_id: int, is_active: bool) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute("UPDATE users SET is_active = ? WHERE id = ?", (1 if is_active else 0, user_id))
    return get_user_by_id(user_id)


def distinct_active_user_ids_since(iso_date: str) -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(DISTINCT user_id) as c FROM waste_scans WHERE created_at >= ?", (iso_date,))
        return cur.fetchone()["c"]


# ---------------------------------------------------------------------
# Waste scans
# ---------------------------------------------------------------------

def create_scan(user_id: int, image_path: str, detected_object: str, category: str,
                 material: str, confidence: float, recyclability: str, recommendation: str,
                 environmental_insight: str, model_version: str, created_at: str | None = None) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO waste_scans (user_id, image_path, detected_object, detected_category, material, "
            "confidence, recyclability, recommendation, environmental_insight, model_version, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, image_path, detected_object, category, material, confidence, recyclability,
             recommendation, environmental_insight, model_version, created_at or now_iso()),
        )
        scan_id = cur.lastrowid
    return get_scan_by_id(scan_id)


def get_scan_by_id(scan_id: int) -> dict | None:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM waste_scans WHERE id = ?", (scan_id,))
        return row_to_dict(cur.fetchone())


def list_scans_for_user(user_id: int, limit: int = 50) -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM waste_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        )
        return rows_to_dicts(cur.fetchall())


def list_all_scans(limit: int = 50) -> list[dict]:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM waste_scans ORDER BY created_at DESC LIMIT ?", (limit,))
        return rows_to_dicts(cur.fetchall())


def count_scans() -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) as c FROM waste_scans")
        return cur.fetchone()["c"]


# ---------------------------------------------------------------------
# Waste records
# ---------------------------------------------------------------------

def create_record(user_id: int, category: str, quantity: float, unit: str, recycled: bool,
                   source: str, department: str | None, date: str | None = None) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO waste_records (user_id, category, quantity, unit, recycled, source, department, date) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, category, quantity, unit, 1 if recycled else 0, source, department, date or now_iso()),
        )
        record_id = cur.lastrowid
    with get_cursor() as cur:
        cur.execute("SELECT * FROM waste_records WHERE id = ?", (record_id,))
        return row_to_dict(cur.fetchone())


def list_records_for_user(user_id: int, limit: int = 500) -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM waste_records WHERE user_id = ? ORDER BY date DESC LIMIT ?",
            (user_id, limit),
        )
        return rows_to_dicts(cur.fetchall())


def count_records() -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) as c FROM waste_records")
        return cur.fetchone()["c"]


def sum_all_waste() -> tuple[float, float]:
    with get_cursor() as cur:
        cur.execute("SELECT COALESCE(SUM(quantity),0) as total FROM waste_records")
        total = cur.fetchone()["total"]
        cur.execute("SELECT COALESCE(SUM(quantity),0) as total FROM waste_records WHERE recycled = 1")
        recycled = cur.fetchone()["total"]
    return total, recycled


# ---------------------------------------------------------------------
# Recycling centers
# ---------------------------------------------------------------------

def create_center(name, latitude, longitude, address, city, accepted_materials,
                   contact=None, operating_hours=None, rating=4.5) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO recycling_centers (name, latitude, longitude, address, city, accepted_materials, "
            "contact, operating_hours, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (name, latitude, longitude, address, city, accepted_materials, contact, operating_hours,
             rating, now_iso()),
        )
        center_id = cur.lastrowid
    return get_center_by_id(center_id)


def get_center_by_id(center_id: int) -> dict | None:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM recycling_centers WHERE id = ?", (center_id,))
        return row_to_dict(cur.fetchone())


def list_centers() -> list[dict]:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM recycling_centers ORDER BY name ASC")
        return rows_to_dicts(cur.fetchall())


def count_centers() -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) as c FROM recycling_centers")
        return cur.fetchone()["c"]


# ---------------------------------------------------------------------
# Sustainability scores
# ---------------------------------------------------------------------

def create_score(user_id, score, recycling_score, reduction_score, consistency_score, disposal_score) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO sustainability_scores (user_id, score, recycling_score, reduction_score, "
            "consistency_score, disposal_score, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, score, recycling_score, reduction_score, consistency_score, disposal_score, now_iso()),
        )
        score_id = cur.lastrowid
    with get_cursor() as cur:
        cur.execute("SELECT * FROM sustainability_scores WHERE id = ?", (score_id,))
        return row_to_dict(cur.fetchone())


def get_latest_score(user_id: int) -> dict | None:
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM sustainability_scores WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1",
            (user_id,),
        )
        return row_to_dict(cur.fetchone())


# ---------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------

def create_recommendation(user_id, title, description, category, priority) -> dict:
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO recommendations (user_id, title, description, category, priority, is_read, created_at) "
            "VALUES (?, ?, ?, ?, ?, 0, ?)",
            (user_id, title, description, category, priority, now_iso()),
        )
        rec_id = cur.lastrowid
    with get_cursor() as cur:
        cur.execute("SELECT * FROM recommendations WHERE id = ?", (rec_id,))
        return row_to_dict(cur.fetchone())


def list_recommendations_for_user(user_id: int, since_iso: str | None = None, limit: int = 20) -> list[dict]:
    with get_cursor() as cur:
        if since_iso:
            cur.execute(
                "SELECT * FROM recommendations WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC",
                (user_id, since_iso),
            )
        else:
            cur.execute(
                "SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            )
        return rows_to_dicts(cur.fetchall())


def count_recommendations() -> int:
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) as c FROM recommendations")
        return cur.fetchone()["c"]


# ---------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------

def seed_achievement(key, name, description, points_required, icon):
    with get_cursor() as cur:
        cur.execute("SELECT id FROM achievements WHERE key = ?", (key,))
        if cur.fetchone():
            return
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO achievements (key, name, description, points_required, icon) VALUES (?, ?, ?, ?, ?)",
            (key, name, description, points_required, icon),
        )


def list_achievements() -> list[dict]:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM achievements ORDER BY points_required ASC")
        return rows_to_dicts(cur.fetchall())


def get_achievement_by_key(key: str) -> dict | None:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM achievements WHERE key = ?", (key,))
        return row_to_dict(cur.fetchone())


def get_user_achievements(user_id: int) -> list[dict]:
    with get_cursor() as cur:
        cur.execute("SELECT * FROM user_achievements WHERE user_id = ?", (user_id,))
        return rows_to_dicts(cur.fetchall())


def award_achievement(user_id: int, achievement_id: int):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?",
            (user_id, achievement_id),
        )
        if cur.fetchone():
            return
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)",
            (user_id, achievement_id, now_iso()),
        )
