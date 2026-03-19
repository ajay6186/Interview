"""
Item-specific data access.
"""
from sqlalchemy import func, select

from app.models.item import Item
from app.repositories.base_repository import BaseRepository


class ItemRepository(BaseRepository[Item]):
    model = Item

    async def get_by_owner(
        self, owner_id: int, *, skip: int = 0, limit: int = 20
    ) -> list[Item]:
        result = await self.db.execute(
            select(Item).where(Item.owner_id == owner_id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_owner(self, owner_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Item).where(Item.owner_id == owner_id)
        )
        return result.scalar_one()

    async def get_published(self, *, skip: int = 0, limit: int = 20) -> list[Item]:
        result = await self.db.execute(
            select(Item).where(Item.is_published.is_(True)).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_and_owner(self, item_id: int, owner_id: int) -> Item | None:
        result = await self.db.execute(
            select(Item).where(Item.id == item_id, Item.owner_id == owner_id)
        )
        return result.scalar_one_or_none()
