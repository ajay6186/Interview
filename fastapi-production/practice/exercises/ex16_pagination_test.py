"""
Exercise 16 — Test pagination thoroughly
==========================================
Goal: Seed 25 items and verify pagination behaviour end-to-end.

TODO: implement the test body for each test function below.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item
from app.models.user import User


@pytest.fixture
async def many_items(db: AsyncSession, regular_user: User) -> list[Item]:
    """Seed 25 items owned by regular_user."""
    items = []
    for i in range(25):
        item = Item(
            title=f"Item {i + 1:02d}",
            is_published=True,
            owner_id=regular_user.id,
        )
        db.add(item)
        items.append(item)
    await db.flush()
    return items


@pytest.mark.asyncio
async def test_first_page(client: AsyncClient, many_items: list[Item]) -> None:
    """page=1&page_size=10 → 10 items, total=25, pages=3"""
    # TODO
    response = await client.get("/api/v1/items/?page=1&page_size=10")
    # assert ...
    raise NotImplementedError("Complete this test")


@pytest.mark.asyncio
async def test_last_page(client: AsyncClient, many_items: list[Item]) -> None:
    """page=3&page_size=10 → 5 items"""
    # TODO
    raise NotImplementedError("Complete this test")


@pytest.mark.asyncio
async def test_beyond_last_page(client: AsyncClient, many_items: list[Item]) -> None:
    """page=4&page_size=10 → 0 items (page beyond data)"""
    # TODO
    raise NotImplementedError("Complete this test")


@pytest.mark.asyncio
async def test_page_size_too_large(client: AsyncClient) -> None:
    """page_size=101 → 422 (exceeds MAX_PAGE_SIZE=100)"""
    # TODO
    raise NotImplementedError("Complete this test")


@pytest.mark.asyncio
async def test_page_zero_rejected(client: AsyncClient) -> None:
    """page=0 → 422 (page must be >= 1)"""
    # TODO
    raise NotImplementedError("Complete this test")
