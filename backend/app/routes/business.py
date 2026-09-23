from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, g

from app import db
from app.auth_utils import roles_required
from app.services.scoring_service import get_or_calculate_latest_score
from app.services.forecasting_service import forecast_waste
from app.services.recommendation_service import generate_recommendations

bp = Blueprint("business", __name__, url_prefix="/api/business")


@bp.get("/dashboard")
@roles_required("business", "admin")
def business_dashboard():
    user = g.current_user
    records = db.list_records_for_user(user["id"], limit=10000)

    total_kg = sum(r["quantity"] for r in records)
    recycled_kg = sum(r["quantity"] for r in records if r["recycled"])
    rate = (recycled_kg / total_kg * 100) if total_kg else 0.0

    today = datetime.utcnow().date()
    this_month_start = today.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    this_month_total = sum(r["quantity"] for r in records if datetime.fromisoformat(r["date"]).date() >= this_month_start)
    last_month_total = sum(
        r["quantity"] for r in records
        if last_month_start <= datetime.fromisoformat(r["date"]).date() <= last_month_end
    )
    monthly_change = ((this_month_total - last_month_total) / last_month_total * 100) if last_month_total else 0.0

    forecast = forecast_waste(user["id"])
    projected_next_month = this_month_total
    if forecast.get("sufficient_data"):
        daily_projection = sum(c["projected_daily_avg"] for c in forecast["categories"])
        projected_next_month = round(daily_projection * 30, 1)

    department_totals = defaultdict(float)
    for r in records:
        department_totals[r["department"] or "Unassigned"] += r["quantity"]

    category_totals = defaultdict(lambda: {"total": 0.0, "recycled": 0.0})
    for r in records:
        category_totals[r["category"]]["total"] += r["quantity"]
        if r["recycled"]:
            category_totals[r["category"]]["recycled"] += r["quantity"]

    score = get_or_calculate_latest_score(user["id"])
    recommendations = generate_recommendations(user)

    monthly_history = []
    for i in range(5, -1, -1):
        month_ref = (this_month_start - timedelta(days=30 * i)).replace(day=1)
        month_recs = [
            r for r in records
            if datetime.fromisoformat(r["date"]).year == month_ref.year
            and datetime.fromisoformat(r["date"]).month == month_ref.month
        ]
        monthly_history.append({
            "month": month_ref.strftime("%b"),
            "total": round(sum(r["quantity"] for r in month_recs), 1),
            "recycled": round(sum(r["quantity"] for r in month_recs if r["recycled"]), 1),
        })

    return jsonify({
        "organization_name": user["organization_name"] or user["name"],
        "metrics": {
            "total_waste_kg": round(total_kg, 1),
            "recycled_kg": round(recycled_kg, 1),
            "recycling_rate": round(rate, 1),
            "monthly_change_pct": round(monthly_change, 1),
            "projected_next_month_kg": projected_next_month,
            "sustainability_score": score["score"],
        },
        "monthly_history": monthly_history,
        "department_breakdown": [
            {"department": dept, "total_kg": round(total, 1)} for dept, total in department_totals.items()
        ],
        "category_breakdown": [
            {"category": cat, "total_kg": round(v["total"], 1), "recycled_kg": round(v["recycled"], 1)}
            for cat, v in category_totals.items()
        ],
        "forecast": forecast,
        "recommendations": [
            {"id": r["id"], "title": r["title"], "description": r["description"], "priority": r["priority"]}
            for r in recommendations[:5]
        ],
    })
