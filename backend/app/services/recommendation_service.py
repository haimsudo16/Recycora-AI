"""
Rule-based AI recommendation & achievement engine.

Recommendations are generated from the user's real stored data (waste
category growth, recycling rate, scan patterns) -- not generic canned
text unrelated to their activity. This is intentionally rule-based
rather than calling an external LLM, so the whole product works fully
offline/self-contained; the interface is small enough to swap in an
LLM-backed generator later.
"""
from collections import defaultdict
from datetime import datetime, timedelta

from app import db

ACHIEVEMENT_DEFS = [
    {"key": "first_scan", "name": "First Scan", "description": "Completed your first AI waste scan.", "points_required": 0, "icon": "scan-line"},
    {"key": "recycling_starter", "name": "Recycling Starter", "description": "Logged 5 recycled waste records.", "points_required": 50, "icon": "recycle"},
    {"key": "waste_reducer", "name": "Waste Reducer", "description": "Reduced total waste generated month over month.", "points_required": 120, "icon": "trending-down"},
    {"key": "green_contributor", "name": "Green Contributor", "description": "Reached 500 Eco Points.", "points_required": 500, "icon": "leaf"},
    {"key": "sustainability_champion", "name": "Sustainability Champion", "description": "Reached a sustainability score of 85 or higher.", "points_required": 1000, "icon": "trophy"},
]


def ensure_achievements_seeded():
    for defn in ACHIEVEMENT_DEFS:
        db.seed_achievement(defn["key"], defn["name"], defn["description"], defn["points_required"], defn["icon"])


def _award(user_id: int, key: str):
    achievement = db.get_achievement_by_key(key)
    if not achievement:
        return
    db.award_achievement(user_id, achievement["id"])


def maybe_award_scan_achievements(user: dict):
    ensure_achievements_seeded()
    scans = db.list_scans_for_user(user["id"], limit=10000)
    if len(scans) >= 1:
        _award(user["id"], "first_scan")
    if user["eco_points"] >= 500:
        _award(user["id"], "green_contributor")


def evaluate_all_achievements(user: dict):
    ensure_achievements_seeded()
    scans = db.list_scans_for_user(user["id"], limit=10000)
    records = db.list_records_for_user(user["id"], limit=10000)
    recycled_count = sum(1 for r in records if r["recycled"])

    if len(scans) >= 1:
        _award(user["id"], "first_scan")
    if recycled_count >= 5:
        _award(user["id"], "recycling_starter")
    if user["eco_points"] >= 500:
        _award(user["id"], "green_contributor")

    from app.services.scoring_service import get_or_calculate_latest_score
    score = get_or_calculate_latest_score(user["id"])
    if score["score"] >= 85:
        _award(user["id"], "sustainability_champion")
    if score["reduction_score"] >= 75 and len(records) >= 6:
        _award(user["id"], "waste_reducer")


def generate_recommendations(user: dict) -> list[dict]:
    """Analyzes real stored data and (re)generates fresh recommendations,
    avoiding duplicate titles created in the last 7 days."""
    records = db.list_records_for_user(user["id"], limit=10000)
    scans = db.list_scans_for_user(user["id"], limit=10000)

    since = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent_titles = {r["title"] for r in db.list_recommendations_for_user(user["id"], since_iso=since)}

    new_recs = []

    if records:
        by_category = defaultdict(list)
        for r in records:
            by_category[r["category"]].append(r)

        now = datetime.utcnow()
        recent_cut = now - timedelta(days=15)
        prior_cut = now - timedelta(days=30)

        growth = {}
        for cat, recs in by_category.items():
            recent = sum(r["quantity"] for r in recs if datetime.fromisoformat(r["date"]) >= recent_cut)
            prior = sum(r["quantity"] for r in recs if prior_cut <= datetime.fromisoformat(r["date"]) < recent_cut)
            if prior > 0:
                growth[cat] = (recent - prior) / prior

        if growth:
            top_cat, top_growth = max(growth.items(), key=lambda kv: kv[1])
            if top_growth > 0.15:
                title = f"{top_cat.title()} waste is trending upward"
                if title not in recent_titles:
                    new_recs.append((
                        title,
                        f"Your {top_cat} waste is up about {round(top_growth * 100)}% over the last two weeks "
                        f"compared to the prior period. Reviewing purchasing or storage habits for this category "
                        f"could help reverse the trend.",
                        top_cat, "high",
                    ))

        total = sum(r["quantity"] for r in records)
        recycled = sum(r["quantity"] for r in records if r["recycled"])
        rate = (recycled / total) if total else 0
        if rate < 0.5:
            title = "Your recycling rate has room to improve"
            if title not in recent_titles:
                new_recs.append((
                    title,
                    f"Only about {round(rate * 100)}% of your logged waste is marked as recycled. Check which "
                    f"materials your local program accepts — you may be able to divert more than you think.",
                    None, "medium",
                ))
        elif rate > 0.85:
            title = "Excellent recycling consistency"
            if title not in recent_titles:
                new_recs.append((
                    title,
                    f"You're recycling roughly {round(rate * 100)}% of tracked waste. Keep it up — consider "
                    f"mentoring others or auditing remaining non-recycled categories for further gains.",
                    None, "low",
                ))

    if scans:
        hazardous = [s for s in scans if s["recyclability"] == "hazardous"]
        if hazardous:
            title = "E-waste or hazardous items detected in recent scans"
            if title not in recent_titles:
                new_recs.append((
                    title,
                    "Some recent scans were classified as hazardous/e-waste. Make sure these are taken to a "
                    "certified drop-off point rather than general waste or standard recycling.",
                    "ewaste", "high",
                ))

    if not records and not scans:
        title = "Get started with your first scan"
        if title not in recent_titles:
            new_recs.append((
                title,
                "Scan an item with the AI Waste Scanner or log a waste record to start building your "
                "personalized sustainability profile.",
                None, "medium",
            ))

    for title, description, category, priority in new_recs:
        db.create_recommendation(user["id"], title, description, category, priority)

    return db.list_recommendations_for_user(user["id"], limit=20)
