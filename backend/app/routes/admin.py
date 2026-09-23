from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from app import db
from app.auth_utils import roles_required
from app.schemas import RecyclingCenterCreate
from app.validation import parse_json, user_to_public, center_to_public

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/analytics")
@roles_required("admin")
def admin_analytics():
    total_users = db.count_users()
    active_cut = (datetime.utcnow() - timedelta(days=30)).isoformat()
    active_users = db.distinct_active_user_ids_since(active_cut)
    total_scans = db.count_scans()
    total_waste, total_recycled = db.sum_all_waste()
    avg_rate = (total_recycled / total_waste * 100) if total_waste else 0.0

    return jsonify({
        "total_users": total_users,
        "active_users_30d": active_users,
        "total_scans": total_scans,
        "total_waste_tracked_kg": round(total_waste, 1),
        "total_recycled_kg": round(total_recycled, 1),
        "avg_recycling_rate": round(avg_rate, 1),
        "role_counts": db.count_users_by_role(),
        "total_recycling_centers": db.count_centers(),
        "total_recommendations": db.count_recommendations(),
    })


@bp.get("/users")
@roles_required("admin")
def admin_list_users():
    return jsonify([user_to_public(u) for u in db.list_users()])


@bp.patch("/users/<int:user_id>/toggle-active")
@roles_required("admin")
def toggle_user_active(user_id):
    from flask import g
    user = db.get_user_by_id(user_id)
    if not user:
        return jsonify({"detail": "User not found"}), 404
    if user["id"] == g.current_user["id"]:
        return jsonify({"detail": "You cannot deactivate your own account"}), 400
    updated = db.set_user_active(user_id, not user["is_active"])
    return jsonify(user_to_public(updated))


@bp.get("/scans")
@roles_required("admin")
def admin_list_scans():
    limit = min(int(request.args.get("limit", 50)), 200)
    scans = db.list_all_scans(limit=limit)
    return jsonify([
        {
            "id": s["id"], "user_id": s["user_id"], "detected_object": s["detected_object"],
            "category": s["detected_category"], "material": s["material"], "confidence": s["confidence"],
            "recyclability": s["recyclability"], "created_at": s["created_at"],
        }
        for s in scans
    ])


@bp.post("/recycling-centers")
@roles_required("admin")
def admin_create_center():
    payload, err = parse_json(RecyclingCenterCreate, request.get_json(silent=True))
    if err:
        return err
    center = db.create_center(**payload.model_dump())
    return jsonify(center_to_public(center)), 201
