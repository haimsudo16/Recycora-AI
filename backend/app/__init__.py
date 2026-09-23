from pathlib import Path

from flask import Flask, jsonify, send_from_directory, request

from app.config import get_settings
from app.db import init_db


def create_app() -> Flask:
    settings = get_settings()
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    with app.app_context():
        init_db()

    # ---- CORS (hand-rolled - no extra dependency needed) ----
    allowed_origins = set(settings.cors_origins_list)

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin and (origin in allowed_origins or "*" in allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, PUT, DELETE, OPTIONS"
        return response

    @app.route("/api/<path:_any>", methods=["OPTIONS"])
    def cors_preflight(_any):
        return "", 204

    # ---- Static file serving for uploaded scan images ----
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(str(Path(settings.UPLOAD_DIR).resolve()), filename)

    # ---- Blueprints ----
    from app.routes import auth, users, scans, waste, analytics, recycling_centers, business, admin, assistant

    app.register_blueprint(auth.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(scans.bp)
    app.register_blueprint(waste.bp)
    app.register_blueprint(analytics.bp)
    app.register_blueprint(recycling_centers.bp)
    app.register_blueprint(business.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(assistant.bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "app": settings.APP_NAME, "env": settings.ENV})

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"detail": "Not found"}), 404

    @app.errorhandler(413)
    def too_large(_e):
        return jsonify({"detail": "Uploaded file is too large."}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"detail": "Internal server error", "message": str(e)}), 500

    return app
