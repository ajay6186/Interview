"""
Shared / generic Pydantic schemas.
"""
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

DataT = TypeVar("DataT")


class AppBaseModel(BaseModel):
    """Project-wide base model with sensible defaults."""

    model_config = ConfigDict(
        from_attributes=True,       # allow ORM → schema conversion
        populate_by_name=True,      # accept both alias and field name
        str_strip_whitespace=True,  # auto-strip leading/trailing spaces
    )


class PaginatedResponse(AppBaseModel, Generic[DataT]):
    """
    Generic paginated response wrapper.

    Example:
        PaginatedResponse[UserResponse]
    """

    items: list[DataT]
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def create(
        cls,
        items: list[DataT],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[DataT]":
        pages = max(1, -(-total // page_size))  # ceiling division
        return cls(items=items, total=total, page=page, page_size=page_size, pages=pages)


class MessageResponse(AppBaseModel):
    message: str
