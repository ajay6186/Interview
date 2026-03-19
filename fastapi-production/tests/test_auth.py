"""
Tests for authentication endpoints:
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.conftest import auth_headers

BASE = "/api/v1/auth"


# ── Login ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, regular_user: User) -> None:
    response = await client.post(
        f"{BASE}/login",
        data={"username": regular_user.email, "password": "Password1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, regular_user: User) -> None:
    response = await client.post(
        f"{BASE}/login",
        data={"username": regular_user.email, "password": "WrongPass99"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/login",
        data={"username": "nobody@example.com", "password": "Password1"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user(
    client: AsyncClient, db: AsyncSession, regular_user: User
) -> None:
    regular_user.is_active = False
    await db.flush()

    response = await client.post(
        f"{BASE}/login",
        data={"username": regular_user.email, "password": "Password1"},
    )
    assert response.status_code == 401


# ── Refresh ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_success(client: AsyncClient, regular_user: User) -> None:
    # First get tokens via login
    login_resp = await client.post(
        f"{BASE}/login",
        data={"username": regular_user.email, "password": "Password1"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post(f"{BASE}/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_refresh_with_access_token_fails(
    client: AsyncClient, regular_user_token: str
) -> None:
    """Passing an access token to the refresh endpoint should be rejected."""
    response = await client.post(
        f"{BASE}/refresh", json={"refresh_token": regular_user_token}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/refresh", json={"refresh_token": "this.is.invalid"}
    )
    assert response.status_code == 401
