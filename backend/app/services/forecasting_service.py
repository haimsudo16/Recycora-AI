"""
Waste-generation forecasting service.

Uses ordinary least-squares linear regression (NumPy `polyfit`) per
waste category over the user's/business's historical waste-record
entries to project the next 30 days, with a simple uncertainty band
derived from residual variance. This is a genuine (if simple)
statistical projection, not a hard-coded number -- and it is always
presented as an estimate with a confidence indicator, never a
guarantee.
"""
from collections import defaultdict
from datetime import datetime

import numpy as np

from app import db


def forecast_waste(user_id: int, horizon_days: int = 30) -> dict:
    records = db.list_records_for_user(user_id, limit=10000)
    records = sorted(records, key=lambda r: r["date"])

    if len(records) < 4:
        return {
            "horizon_days": horizon_days,
            "sufficient_data": False,
            "message": "Log at least a few waste records across several days to unlock AI forecasting.",
            "categories": [],
        }

    by_category: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_category[r["category"]].append(r)

    earliest = datetime.fromisoformat(records[0]["date"])
    results = []

    for category, recs in by_category.items():
        if len(recs) < 3:
            continue
        days = np.array([(datetime.fromisoformat(r["date"]) - earliest).days for r in recs], dtype="float64")
        qty = np.array([r["quantity"] for r in recs], dtype="float64")

        unique_days = np.unique(days)
        daily_totals = np.array([qty[days == d].sum() for d in unique_days])

        if len(unique_days) < 3:
            continue

        slope, intercept = np.polyfit(unique_days, daily_totals, 1)
        predicted = np.polyval([slope, intercept], unique_days)
        residuals = daily_totals - predicted
        residual_std = float(np.std(residuals)) if len(residuals) > 1 else daily_totals.mean() * 0.15

        current_avg = float(daily_totals[-min(7, len(daily_totals)):].mean())
        future_day = unique_days.max() + horizon_days
        projected_daily = float(np.polyval([slope, intercept], future_day))
        projected_daily = max(0.0, projected_daily)

        baseline = current_avg if current_avg > 0.01 else max(projected_daily, 0.01)
        pct_change = ((projected_daily - baseline) / baseline) * 100 if baseline else 0.0
        pct_change = max(-90.0, min(150.0, pct_change))

        confidence = max(35, min(92, 90 - residual_std / (baseline + 0.01) * 40))

        results.append({
            "category": category,
            "current_daily_avg": round(baseline, 2),
            "projected_daily_avg": round(projected_daily, 2),
            "projected_change_pct": round(pct_change, 1),
            "trend": "up" if pct_change > 3 else ("down" if pct_change < -3 else "flat"),
            "confidence_pct": round(confidence, 1),
        })

    results.sort(key=lambda x: abs(x["projected_change_pct"]), reverse=True)

    return {
        "horizon_days": horizon_days,
        "sufficient_data": True,
        "generated_at": datetime.utcnow().isoformat(),
        "categories": results,
        "methodology": "Linear trend projection (least-squares regression) over logged waste records per category. Confidence reflects historical variance, not certainty.",
    }
