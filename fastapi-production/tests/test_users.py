"""
Tests for user endpoints:
  POST   /api/v1/users/          (register)
  GET    /api/v1/users/me
  PATCH  /api/v1/users/me
  GET    /api/v1/users/          (list — superuser)
  GET    /api/v1/users/{id}
  DELETE /api/v1/users/{id}
"""
import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

BASE = "/api/v1/users"


# ── Registration ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/",
        json={
            "email": "new@example.com",
            "username": "newuser",
            "password": "Password1",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["username"] == "newuser"
    assert "hashed_password" not in data  # never expose the hash


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, regular_user: User) -> None:
    response = await client.post(
        f"{BASE}/",
        json={
            "email": regular_user.email,
            "username": "differentuser",
            "password": "Password1",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, regular_user: User) -> None:
    response = await client.post(
        f"{BASE}/",
        json={
            "email": "other@example.com",
            "username": regular_user.username,
            "password": "Password1",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/",
        json={"email": "weak@example.com", "username": "weakuser", "password": "weakpw"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/",
        json={"email": "not-an-email", "username": "someuser", "password": "Password1"},
    )
    assert response.status_code == 422


# ── GET /me ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, regular_user: User, regular_user_token: str) -> None:
    response = await client.get(f"{BASE}/me", headers=auth_headers(regular_user_token))
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == regular_user.id
    assert data["email"] == regular_user.email


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient) -> None:
    response = await client.get(f"{BASE}/me")
    assert response.status_code == 401


# ── PATCH /me ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_me_full_name(
    client: AsyncClient, regular_user_token: str
) -> None:
    response = await client.patch(
        f"{BASE}/me",
        json={"full_name": "Updated Name"},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_me_no_fields(
    client: AsyncClient, regular_user_token: str
) -> None:
    """Sending empty payload should fail validation."""
    response = await client.patch(
        f"{BASE}/me",
        json={},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 422


# ── GET / (list users) ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_users_superuser(
    client: AsyncClient, regular_user: User, superuser_token: str
) -> None:
    response = await client.get(f"{BASE}/", headers=auth_headers(superuser_token))
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_users_regular_forbidden(
    client: AsyncClient, regular_user_token: str
) -> None:
    response = await client.get(f"{BASE}/", headers=auth_headers(regular_user_token))
    assert response.status_code == 403


# ── GET /{id} ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_own_profile(
    client: AsyncClient, regular_user: User, regular_user_token: str
) -> None:
    response = await client.get(
        f"{BASE}/{regular_user.id}", headers=auth_headers(regular_user_token)
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_other_user_as_regular(
    client: AsyncClient, superuser: User, regular_user_token: str
) -> None:
    response = await client.get(
        f"{BASE}/{superuser.id}", headers=auth_headers(regular_user_token)
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_nonexistent_user(client: AsyncClient, superuser_token: str) -> None:
    response = await client.get(f"{BASE}/99999", headers=auth_headers(superuser_token))
    assert response.status_code == 404


# ── DELETE /{id} ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_self(
    client: AsyncClient, regular_user: User, regular_user_token: str
) -> None:
    response = await client.delete(
        f"{BASE}/{regular_user.id}", headers=auth_headers(regular_user_token)
    )
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()
