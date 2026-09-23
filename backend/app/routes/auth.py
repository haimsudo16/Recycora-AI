from flask import Blueprint, request, jsonify, g

from app import db
from app.schemas import UserRegister, UserLogin
from app.security import hash_password, verify_password, create_access_token
from app.validation import parse_json, user_to_public
from app.auth_utils import login_required

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    payload, err = parse_json(UserRegister, request.get_json(silent=True))
    if err:
        return err

    if db.get_user_by_email(payload.email):
        return jsonify({"detail": "An account with this email already exists"}), 400

    role = "business" if payload.role == "business" else "user"
    user = db.create_user(
        name=payload.name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
        organization_name=payload.organization_name if role == "business" else None,
    )

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return jsonify({"access_token": token, "token_type": "bearer", "user": user_to_public(user)}), 201


@bp.post("/login")
def login():
    payload, err = parse_json(UserLogin, request.get_json(silent=True))
    if err:
        return err

    user = db.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        return jsonify({"detail": "Invalid email or password"}), 401
    if not user["is_active"]:
        return jsonify({"detail": "This account has been deactivated"}), 403

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})
    return jsonify({"access_token": token, "token_type": "bearer", "user": user_to_public(user)})


@bp.get("/me")
@login_required
def me():
    return jsonify(user_to_public(g.current_user))
