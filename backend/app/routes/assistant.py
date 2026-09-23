from flask import Blueprint, request, jsonify

from app.auth_utils import login_required
from app.schemas import AssistantQuery
from app.services.assistant_service import answer, SUGGESTED_QUESTIONS
from app.validation import parse_json

bp = Blueprint("assistant", __name__, url_prefix="/api/assistant")


@bp.post("/ask")
@login_required
def ask_assistant():
    payload, err = parse_json(AssistantQuery, request.get_json(silent=True))
    if err:
        return err
    result = answer(payload.message)
    return jsonify(result)


@bp.get("/suggestions")
def get_suggestions():
    return jsonify(SUGGESTED_QUESTIONS)
