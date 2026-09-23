import math

from flask import Blueprint, request, jsonify

from app import db
from app.auth_utils import roles_required
from app.schemas import RecyclingCenterCreate
from app.validation import parse_json, center_to_public

bp = Blueprint("recycling_centers", __name__, url_prefix="/api/recycling-centers")


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@bp.get("")
def list_centers():
    category = request.args.get("category")
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)

    centers = db.list_centers()

    if category and category.lower() != "all":
        centers = [c for c in centers if category.lower() in c["accepted_materials"].lower()]

    results = []
    for c in centers:
        distance = _haversine_km(lat, lng, c["latitude"], c["longitude"]) if lat is not None and lng is not None else None
        results.append(center_to_public(c, round(distance, 1) if distance is not None else None))

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.get("distance_km", 999999))

    return jsonify(results)


@bp.post("")
@roles_required("admin")
def create_center():
    payload, err = parse_json(RecyclingCenterCreate, request.get_json(silent=True))
    if err:
        return err
    center = db.create_center(**payload.model_dump())
    return jsonify(center_to_public(center)), 201


@bp.get("/<int:center_id>")
def get_center(center_id):
    center = db.get_center_by_id(center_id)
    if not center:
        return jsonify({"detail": "Recycling center not found"}), 404
    return jsonify(center_to_public(center))
