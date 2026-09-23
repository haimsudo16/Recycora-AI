from pathlib import Path

from flask import jsonify
from pydantic import ValidationError


def parse_json(schema_cls, data):
    """Validate a dict against a pydantic schema. Returns (instance, None)
    on success, or (None, (response, status)) on failure so routes can
    `return err` directly."""
    try:
        return schema_cls.model_validate(data or {}), None
    except ValidationError as exc:
        errors = [
            {"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return None, (jsonify({"detail": "Validation error", "errors": errors}), 422)


def user_to_public(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "organization_name": user["organization_name"],
        "eco_points": user["eco_points"],
        "created_at": user["created_at"],
    }


def scan_to_public(scan: dict) -> dict:
    return {
        "id": scan["id"],
        "image_path": scan["image_path"],
        "image_url": f"/uploads/{Path(scan['image_path']).name}" if scan.get("image_path") else None,
        "detected_object": scan["detected_object"],
        "detected_category": scan["detected_category"],
        "material": scan["material"],
        "confidence": scan["confidence"],
        "recyclability": scan["recyclability"],
        "recommendation": scan["recommendation"],
        "environmental_insight": scan["environmental_insight"],
        "model_version": scan["model_version"],
        "created_at": scan["created_at"],
    }


def record_to_public(r: dict) -> dict:
    return {
        "id": r["id"],
        "category": r["category"],
        "quantity": r["quantity"],
        "unit": r["unit"],
        "recycled": bool(r["recycled"]),
        "source": r["source"],
        "department": r["department"],
        "date": r["date"],
    }


def center_to_public(c: dict, distance_km: float | None = None) -> dict:
    out = {
        "id": c["id"],
        "name": c["name"],
        "latitude": c["latitude"],
        "longitude": c["longitude"],
        "address": c["address"],
        "city": c["city"],
        "accepted_materials": c["accepted_materials"],
        "contact": c["contact"],
        "operating_hours": c["operating_hours"],
        "rating": c["rating"],
    }
    if distance_km is not None:
        out["distance_km"] = distance_km
    return out


def score_to_public(s: dict) -> dict:
    return {
        "score": s["score"],
        "recycling_score": s["recycling_score"],
        "reduction_score": s["reduction_score"],
        "consistency_score": s["consistency_score"],
        "disposal_score": s["disposal_score"],
        "calculated_at": s["calculated_at"],
    }


def recommendation_to_public(r: dict) -> dict:
    return {
        "id": r["id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "priority": r["priority"],
        "is_read": bool(r["is_read"]),
        "created_at": r["created_at"],
    }


def achievement_to_public(a: dict, earned: bool, earned_at: str | None) -> dict:
    return {
        "id": a["id"],
        "key": a["key"],
        "name": a["name"],
        "description": a["description"],
        "points_required": a["points_required"],
        "icon": a["icon"],
        "earned": earned,
        "earned_at": earned_at,
    }
