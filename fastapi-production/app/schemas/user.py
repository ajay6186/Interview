"""
User Pydantic schemas — full Pydantic v2 style.
"""
import re
from datetime import datetime

from pydantic import EmailStr, Field, field_validator, model_validator

from app.schemas.common import AppBaseModel

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_-]{3,50}$")
_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")


# ── Write schemas (request bodies) ───────────────────────────────────────────

class UserCreate(AppBaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "Username must be 3–50 chars and contain only letters, digits, _ or -"
            )
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must be ≥8 chars and contain uppercase, lowercase, and a digit"
            )
        return v


class UserUpdate(AppBaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        if v is not None and not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must be ≥8 chars and contain uppercase, lowercase, and a digit"
            )
        return v

    @model_validator(mode="after")
    def at_least_one_field(self) -> "UserUpdate":
        if all(v is None for v in [self.full_name, self.email, self.password]):
            raise ValueError("At least one field must be provided for update.")
        return self


# ── Read schemas (response bodies) ────────────────────────────────────────────

class UserResponse(AppBaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str | None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime


class UserListResponse(AppBaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str | None
    is_active: bool
