from flask import Blueprint, jsonify, g

from app.auth_utils import login_required
from app.validation import user_to_public

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.get("/me")
@login_required
def get_me():
    return jsonify(user_to_public(g.current_user))
