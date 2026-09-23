from flask import Blueprint, request, jsonify, g

from app import db
from app.auth_utils import login_required
from app.schemas import WasteRecordCreate
from app.services.recommendation_service import evaluate_all_achievements
from app.validation import parse_json, record_to_public

bp = Blueprint("waste", __name__, url_prefix="/api/waste-records")


@bp.post("")
@login_required
def create_record():
    payload, err = parse_json(WasteRecordCreate, request.get_json(silent=True))
    if err:
        return err

    date_str = payload.date.isoformat() if payload.date else None
    record = db.create_record(
        user_id=g.current_user["id"],
        category=payload.category.strip().lower(),
        quantity=payload.quantity,
        unit=payload.unit,
        recycled=payload.recycled,
        source=payload.source,
        department=payload.department,
        date=date_str,
    )

    points = int(payload.quantity * (3 if payload.recycled else 1))
    db.add_eco_points(g.current_user["id"], max(1, points))
    g.current_user = db.get_user_by_id(g.current_user["id"])

    evaluate_all_achievements(g.current_user)

    return jsonify(record_to_public(record)), 201


@bp.get("")
@login_required
def list_records():
    limit = min(int(request.args.get("limit", 200)), 500)
    records = db.list_records_for_user(g.current_user["id"], limit=limit)
    return jsonify([record_to_public(r) for r in records])
