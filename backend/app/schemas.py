"""Pydantic request-validation schemas (framework-agnostic - used
manually inside Flask routes rather than via FastAPI's dependency
injection)."""
import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_email(v: str) -> str:
    if not EMAIL_RE.match(v):
        raise ValueError("Invalid email address")
    return v.lower()


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="user", pattern="^(user|business)$")
    organization_name: Optional[str] = None

    _v_email = field_validator("email")(_validate_email)


class UserLogin(BaseModel):
    email: str
    password: str

    _v_email = field_validator("email")(_validate_email)


class WasteRecordCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    quantity: float = Field(gt=0)
    unit: str = Field(default="kg", pattern="^(kg|lb|item)$")
    recycled: bool = False
    source: str = "manual"
    department: Optional[str] = None
    date: Optional[datetime] = None


class RecyclingCenterCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: str
    city: str
    accepted_materials: str
    contact: Optional[str] = None
    operating_hours: Optional[str] = None
    rating: float = 4.5


class AssistantQuery(BaseModel):
    message: str = Field(min_length=1, max_length=500)
