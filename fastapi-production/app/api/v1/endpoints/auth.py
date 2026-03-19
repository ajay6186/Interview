"""
Auth endpoints: login (get tokens), token refresh, logout.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError

from app.core.dependencies import DBSession
from app.core.exceptions import UnauthorizedException
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.token import RefreshTokenRequest, Token
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=Token,
    summary="Login — obtain access & refresh tokens",
    responses={401: {"description": "Invalid credentials"}},
)
async def login(
    db: DBSession,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    Authenticate with **email** (username field) and **password**.
    Returns a JWT access token (short-lived) and a refresh token (long-lived).
    """
    service = UserService(db)
    user = await service.authenticate(form_data.username, form_data.password)
    if user is None:
        raise UnauthorizedException("Incorrect email or password.")
    if not user.is_active:
        raise UnauthorizedException("User account is disabled.")

    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh — obtain a new access token",
    responses={401: {"description": "Invalid or expired refresh token"}},
)
async def refresh_token(db: DBSession, body: RefreshTokenRequest) -> Token:
    """
    Exchange a valid **refresh token** for a new access token pair.
    """
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Expected refresh token.")
        user_id: str = payload["sub"]
    except JWTError as exc:
        raise UnauthorizedException("Invalid or expired refresh token.") from exc

    from app.repositories.user_repository import UserRepository

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))
    if user is None or not user.is_active:
        raise UnauthorizedException("User not found or inactive.")

    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
