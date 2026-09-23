from flask import Blueprint, request, jsonify, g

from app import db
from app.auth_utils import login_required
from app.file_upload import save_upload, UploadError
from app.services.ai_service import classify_waste_image
from app.services.recommendation_service import maybe_award_scan_achievements
from app.validation import scan_to_public

bp = Blueprint("scans", __name__, url_prefix="/api/scans")


@bp.post("")
@login_required
def create_scan():
    file = request.files.get("file")
    try:
        stored_path = save_upload(file)
    except UploadError as e:
        return jsonify({"detail": e.message}), e.status_code

    try:
        result = classify_waste_image(stored_path)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"detail": f"AI classification failed: {exc}"}), 500

    scan = db.create_scan(
        user_id=g.current_user["id"],
        image_path=stored_path,
        detected_object=result.object_name,
        category=result.category,
        material=result.material,
        confidence=result.confidence,
        recyclability=result.recyclability,
        recommendation=result.recommendation,
        environmental_insight=result.environmental_insight,
        model_version=result.model_version,
    )

    db.add_eco_points(g.current_user["id"], 10)
    g.current_user = db.get_user_by_id(g.current_user["id"])
    maybe_award_scan_achievements(g.current_user)

    return jsonify(scan_to_public(scan)), 201


@bp.get("")
@login_required
def list_scans():
    limit = min(int(request.args.get("limit", 50)), 200)
    scans = db.list_scans_for_user(g.current_user["id"], limit=limit)
    return jsonify([scan_to_public(s) for s in scans])


@bp.get("/<int:scan_id>")
@login_required
def get_scan(scan_id):
    scan = db.get_scan_by_id(scan_id)
    if not scan or scan["user_id"] != g.current_user["id"]:
        return jsonify({"detail": "Scan not found"}), 404
    return jsonify(scan_to_public(scan))
