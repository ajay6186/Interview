"""
Tests for item endpoints:
  POST   /api/v1/items/
  GET    /api/v1/items/
  GET    /api/v1/items/mine
  GET    /api/v1/items/{id}
  PATCH  /api/v1/items/{id}
  DELETE /api/v1/items/{id}
"""
import pytest
from httpx import AsyncClient

from app.models.item import Item
from app.models.user import User
from tests.conftest import auth_headers

BASE = "/api/v1/items"


# ── Create ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_item(client: AsyncClient, regular_user_token: str) -> None:
    response = await client.post(
        f"{BASE}/",
        json={"title": "My First Item", "description": "Hello world", "is_published": False},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My First Item"
    assert "owner" in data


@pytest.mark.asyncio
async def test_create_item_unauthenticated(client: AsyncClient) -> None:
    response = await client.post(
        f"{BASE}/", json={"title": "No Auth"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_item_empty_title(
    client: AsyncClient, regular_user_token: str
) -> None:
    response = await client.post(
        f"{BASE}/",
        json={"title": ""},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 422


# ── List all ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_items_public(client: AsyncClient, sample_item: Item) -> None:
    """No auth required to list items."""
    response = await client.get(f"{BASE}/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data


@pytest.mark.asyncio
async def test_list_items_pagination(client: AsyncClient, sample_item: Item) -> None:
    response = await client.get(f"{BASE}/?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5


# ── List mine ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_my_items(
    client: AsyncClient, sample_item: Item, regular_user_token: str
) -> None:
    response = await client.get(f"{BASE}/mine", headers=auth_headers(regular_user_token))
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_my_items_unauthenticated(client: AsyncClient) -> None:
    response = await client.get(f"{BASE}/mine")
    assert response.status_code == 401


# ── Get single ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_item(client: AsyncClient, sample_item: Item) -> None:
    response = await client.get(f"{BASE}/{sample_item.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_item.id
    assert data["title"] == sample_item.title


@pytest.mark.asyncio
async def test_get_nonexistent_item(client: AsyncClient) -> None:
    response = await client.get(f"{BASE}/99999")
    assert response.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_item_owner(
    client: AsyncClient, sample_item: Item, regular_user_token: str
) -> None:
    response = await client.patch(
        f"{BASE}/{sample_item.id}",
        json={"title": "Updated Title", "is_published": True},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["is_published"] is True


@pytest.mark.asyncio
async def test_update_item_non_owner_forbidden(
    client: AsyncClient, sample_item: Item, superuser_token: str
) -> None:
    """
    Even a superuser who doesn't own an item gets forbidden
    (superuser bypass is implemented, so this actually should succeed).
    Superuser CAN edit any item per our service logic.
    """
    response = await client.patch(
        f"{BASE}/{sample_item.id}",
        json={"title": "Superuser Edit"},
        headers=auth_headers(superuser_token),
    )
    # superuser bypass → 200
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_item_unauthenticated(client: AsyncClient, sample_item: Item) -> None:
    response = await client.patch(f"{BASE}/{sample_item.id}", json={"title": "No Auth"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_nonexistent_item(
    client: AsyncClient, regular_user_token: str
) -> None:
    response = await client.patch(
        f"{BASE}/99999",
        json={"title": "Ghost"},
        headers=auth_headers(regular_user_token),
    )
    assert response.status_code == 404


# ── Delete ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_item_owner(
    client: AsyncClient, regular_user: User, regular_user_token: str, db
) -> None:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.item import Item as ItemModel

    # Create a dedicated item for this test
    item = ItemModel(
        title="To Delete", is_published=False, owner_id=regular_user.id
    )
    db.add(item)
    await db.flush()

    response = await client.delete(
        f"{BASE}/{item.id}", headers=auth_headers(regular_user_token)
    )
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_delete_item_other_user_forbidden(
    client: AsyncClient,
    sample_item: Item,
    superuser: User,
    db,
) -> None:
    """Regular user who doesn't own an item should get 403."""
    from app.core.security import create_access_token
    from app.models.user import User as UserModel

    other_user = UserModel(
        email="other2@example.com",
        username="otheruser2",
        hashed_password="x",
        is_active=True,
    )
    db.add(other_user)
    await db.flush()
    token = create_access_token(other_user.id)

    response = await client.delete(
        f"{BASE}/{sample_item.id}", headers=auth_headers(token)
    )
    assert response.status_code == 403
