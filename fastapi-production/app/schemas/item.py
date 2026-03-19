"""
Item Pydantic schemas.
"""
from datetime import datetime

from pydantic import Field

from app.schemas.common import AppBaseModel


# ── Write schemas ──────────────────────────────────────────────────────────────

class ItemCreate(AppBaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    is_published: bool = False


class ItemUpdate(AppBaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    is_published: bool | None = None


# ── Read schemas ───────────────────────────────────────────────────────────────

class ItemOwnerResponse(AppBaseModel):
    """Nested owner info embedded in item responses."""
    id: int
    username: str
    email: str


class ItemResponse(AppBaseModel):
    id: int
    title: str
    description: str | None
    is_published: bool
    owner_id: int
    owner: ItemOwnerResponse
    created_at: datetime
    updated_at: datetime


class ItemListResponse(AppBaseModel):
    id: int
    title: str
    is_published: bool
    owner_id: int
    created_at: datetime
