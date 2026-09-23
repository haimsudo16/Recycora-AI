"""
Sustainability scoring engine.

The score is computed from the user's *actual* stored waste records and
scans -- never fabricated. Four sub-scores (0-100) are blended into an
overall score. Weights are configurable constants so the methodology can
be tuned or documented for an "Estimated Impact" info modal on the
frontend.
"""
from datetime import datetime, timedelta

from app import db

WEIGHTS = {
    "recycling": 0.35,
    "reduction": 0.25,
    "consistency": 0.20,
    "disposal": 0.20,
}


def _parse(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str)


def _recycling_score(records: list[dict]) -> int:
    if not records:
        return 50
    total = sum(r["quantity"] for r in records)
    recycled = sum(r["quantity"] for r in records if r["recycled"])
    if total == 0:
        return 50
    rate = recycled / total
    return round(min(100, rate * 100))


def _reduction_score(records: list[dict]) -> int:
    if len(records) < 2:
        return 60
    now = datetime.utcnow()
    recent_cut = now - timedelta(days=15)
    prior_cut = now - timedelta(days=30)

    recent_total = sum(r["quantity"] for r in records if _parse(r["date"]) >= recent_cut)
    prior_total = sum(r["quantity"] for r in records if prior_cut <= _parse(r["date"]) < recent_cut)

    if prior_total == 0:
        return 65 if recent_total == 0 else 55

    change = (recent_total - prior_total) / prior_total
    score = 55 - (change * 90)
    return round(max(5, min(100, score)))


def _consistency_score(records: list[dict], scans: list[dict]) -> int:
    now = datetime.utcnow()
    window_start = now - timedelta(days=30)
    active_days = {_parse(r["date"]).date() for r in records if _parse(r["date"]) >= window_start}
    active_days |= {_parse(s["created_at"]).date() for s in scans if _parse(s["created_at"]) >= window_start}
    if not active_days:
        return 40
    ratio = len(active_days) / 30
    return round(min(100, 35 + ratio * 130))


def _disposal_score(scans: list[dict]) -> int:
    if not scans:
        return 55
    good = sum(1 for s in scans if s["recyclability"] in ("recyclable", "conditional"))
    rate = good / len(scans)
    avg_conf = sum(s["confidence"] for s in scans) / len(scans)
    score = rate * 70 + (avg_conf / 100) * 30
    return round(min(100, max(10, score)))


def calculate_sustainability_score(user_id: int) -> dict:
    records = db.list_records_for_user(user_id, limit=10000)
    scans = db.list_scans_for_user(user_id, limit=10000)

    recycling = _recycling_score(records)
    reduction = _reduction_score(records)
    consistency = _consistency_score(records, scans)
    disposal = _disposal_score(scans)

    overall = round(
        recycling * WEIGHTS["recycling"]
        + reduction * WEIGHTS["reduction"]
        + consistency * WEIGHTS["consistency"]
        + disposal * WEIGHTS["disposal"]
    )

    return db.create_score(user_id, overall, recycling, reduction, consistency, disposal)


def get_or_calculate_latest_score(user_id: int, max_age_hours: int = 6) -> dict:
    latest = db.get_latest_score(user_id)
    if latest and (datetime.utcnow() - _parse(latest["calculated_at"])) < timedelta(hours=max_age_hours):
        return latest
    return calculate_sustainability_score(user_id)
