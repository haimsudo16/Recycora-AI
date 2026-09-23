import uuid
from pathlib import Path

from werkzeug.datastructures import FileStorage

from app.config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class UploadError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def save_upload(file: FileStorage) -> str:
    """Validate and persist an uploaded waste-scan image. Returns the
    relative path it was stored at."""
    if not file or not file.filename:
        raise UploadError("No file was uploaded.", 400)

    if file.mimetype not in ALLOWED_CONTENT_TYPES:
        raise UploadError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.", 415)

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = file.read()
    if len(contents) > max_bytes:
        raise UploadError(f"Image exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit.", 413)
    if len(contents) == 0:
        raise UploadError("Uploaded file is empty.", 400)

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / safe_name
    with open(dest, "wb") as f:
        f.write(contents)

    return str(dest)
