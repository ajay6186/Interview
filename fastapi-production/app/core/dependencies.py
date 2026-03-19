"""
Reusable FastAPI dependencies:
  - get_db       (re-exported from database.py for convenience)
  - get_current_user
  - get_current_active_user
  - PaginationParams
"""
from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token

# Re-export for simpler imports across the codebase
__all__ = [
    "get_db",
    "get_current_user",
    "get_current_active_user",
    "PaginationParams",
    "DBSession",
    "CurrentUser",
]

bearer_scheme = HTTPBearer(auto_error=False)

# ── Type aliases (annotated dependencies) ─────────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_db)]


# ── Auth dependencies ─────────────────────────────────────────────────────────

async def get_current_user(
    db: DBSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> "UserModel":  # noqa: F821  – imported lazily to avoid circular imports
    from app.repositories.user_repository import UserRepository

    if credentials is None:
        raise UnauthorizedException("Bearer token missing.")

    try:
        payload = decode_token(credentials.credentials)
        token_type: str = payload.get("type", "")
        if token_type != "access":
            raise UnauthorizedException("Invalid token type.")
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Token subject missing.")
    except JWTError as exc:
        raise UnauthorizedException("Invalid or expired token.") from exc

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))
    if user is None:
        raise UnauthorizedException("User not found.")
    return user


async def get_current_active_user(
    current_user: Annotated["UserModel", Depends(get_current_user)],  # noqa: F821
) -> "UserModel":  # noqa: F821
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user account.")
    return current_user


CurrentUser = Annotated["UserModel", Depends(get_current_active_user)]  # noqa: F821


# ── Pagination dependency ─────────────────────────────────────────────────────

class PaginationParams:
    """
    Common pagination query parameters.

    Usage:
        @router.get("/items")
        async def list_items(pagination: PaginationDep):
            skip = pagination.skip
            limit = pagination.limit
    """

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(
            default=settings.DEFAULT_PAGE_SIZE,
            ge=1,
            le=settings.MAX_PAGE_SIZE,
            description="Number of items per page",
        ),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


PaginationDep = Annotated[PaginationParams, Depends(PaginationParams)]
