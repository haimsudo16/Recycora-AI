from functools import wraps

from flask import request, jsonify, g

from app import db
from app.security import decode_access_token


def _extract_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"detail": "Not authenticated"}), 401
        payload = decode_access_token(token)
        if not payload:
            return jsonify({"detail": "Could not validate credentials"}), 401
        user = db.get_user_by_id(int(payload.get("sub", 0)))
        if not user or not user["is_active"]:
            return jsonify({"detail": "Could not validate credentials"}), 401
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapper(*args, **kwargs):
            if g.current_user["role"] not in roles:
                return jsonify({"detail": "You do not have permission to access this resource"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def current_user() -> dict:
    return g.current_user
