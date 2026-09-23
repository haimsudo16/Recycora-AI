from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, g

from app import db
from app.auth_utils import login_required
from app.services.scoring_service import get_or_calculate_latest_score
from app.services.forecasting_service import forecast_waste
from app.services.recommendation_service import generate_recommendations, ensure_achievements_seeded, evaluate_all_achievements
from app.validation import scan_to_public, score_to_public, recommendation_to_public, achievement_to_public

bp = Blueprint("analytics", __name__, url_prefix="/api")


@bp.get("/dashboard")
@login_required
def get_dashboard():
    user = g.current_user
    records = db.list_records_for_user(user["id"], limit=10000)
    scans = db.list_scans_for_user(user["id"], limit=5)

    total_kg = sum(r["quantity"] for r in records if r["unit"] == "kg")
    recycled_kg = sum(r["quantity"] for r in records if r["unit"] == "kg" and r["recycled"])
    recycling_rate = (recycled_kg / total_kg * 100) if total_kg else 0.0

    score = get_or_calculate_latest_score(user["id"])

    today = datetime.utcnow().date()
    weekly = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_total = sum(r["quantity"] for r in records if datetime.fromisoformat(r["date"]).date() == day)
        day_recycled = sum(r["quantity"] for r in records if datetime.fromisoformat(r["date"]).date() == day and r["recycled"])
        weekly.append({"date": day.isoformat(), "total": round(day_total, 2), "recycled": round(day_recycled, 2)})

    monthly = []
    for i in range(5, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        month_recs = [r for r in records if datetime.fromisoformat(r["date"]).year == month_start.year
                      and datetime.fromisoformat(r["date"]).month == month_start.month]
        m_total = sum(r["quantity"] for r in month_recs)
        m_recycled = sum(r["quantity"] for r in month_recs if r["recycled"])
        rate = (m_recycled / m_total * 100) if m_total else 0
        monthly.append({"month": month_start.strftime("%b"), "rate": round(rate, 1), "total": round(m_total, 2)})

    category_totals = defaultdict(float)
    for r in records:
        category_totals[r["category"]] += r["quantity"]
    category_distribution = [
        {"category": cat, "quantity": round(qty, 2)}
        for cat, qty in sorted(category_totals.items(), key=lambda x: -x[1])
    ]

    return jsonify({
        "metrics": {
            "total_waste_kg": round(total_kg, 1),
            "recycled_kg": round(recycled_kg, 1),
            "recycling_rate": round(recycling_rate, 1),
            "sustainability_score": score["score"],
            "eco_points": user["eco_points"],
        },
        "weekly_chart": weekly,
        "monthly_trend": monthly,
        "category_distribution": category_distribution,
        "recent_scans": [scan_to_public(s) for s in scans],
        "sustainability_breakdown": score_to_public(score),
        "is_demo_data": user["email"].endswith("@demo.recycora.ai"),
    })


def _category_breakdown(records):
    totals = defaultdict(lambda: {"total": 0.0, "recycled": 0.0})
    for r in records:
        totals[r["category"]]["total"] += r["quantity"]
        if r["recycled"]:
            totals[r["category"]]["recycled"] += r["quantity"]
    return [
        {
            "category": cat,
            "total_kg": round(v["total"], 2),
            "recycled_kg": round(v["recycled"], 2),
            "rate_pct": round((v["recycled"] / v["total"] * 100) if v["total"] else 0, 1),
        }
        for cat, v in sorted(totals.items(), key=lambda x: -x[1]["total"])
    ]


@bp.get("/analytics")
@login_required
def get_analytics():
    user = g.current_user
    records = db.list_records_for_user(user["id"], limit=10000)
    scans = db.list_scans_for_user(user["id"], limit=10000)

    diverted_kg = sum(r["quantity"] for r in records if r["recycled"])
    plastic_kg = sum(r["quantity"] for r in records if r["category"] == "plastic")
    paper_kg = sum(r["quantity"] for r in records if r["category"] == "paper")

    return jsonify({
        "estimated_impact": {
            "waste_diverted_from_landfill_kg": round(diverted_kg, 1),
            "recyclable_material_recovered_kg": round(diverted_kg, 1),
            "plastic_reduction_kg": round(plastic_kg * 0.15, 1),
            "paper_reduction_kg": round(paper_kg * 0.1, 1),
            "methodology_note": "Estimates derived from your logged waste records using standard diversion assumptions; not a certified environmental audit.",
        },
        "total_scans": len(scans),
        "total_records": len(records),
        "avg_scan_confidence": round(sum(s["confidence"] for s in scans) / len(scans), 1) if scans else None,
        "category_breakdown": _category_breakdown(records),
    })


@bp.get("/forecast")
@login_required
def get_forecast():
    return jsonify(forecast_waste(g.current_user["id"]))


@bp.get("/recommendations")
@login_required
def get_recommendations():
    recs = generate_recommendations(g.current_user)
    return jsonify([recommendation_to_public(r) for r in recs])


@bp.get("/achievements")
@login_required
def get_achievements():
    ensure_achievements_seeded()
    evaluate_all_achievements(g.current_user)

    all_achievements = db.list_achievements()
    earned_links = db.get_user_achievements(g.current_user["id"])
    earned = {ua["achievement_id"]: ua["earned_at"] for ua in earned_links}

    return jsonify([
        achievement_to_public(a, a["id"] in earned, earned.get(a["id"]))
        for a in all_achievements
    ])
