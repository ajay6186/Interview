"""
Item business logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.item import Item
from app.models.user import User
from app.repositories.item_repository import ItemRepository
from app.schemas.item import ItemCreate, ItemUpdate


class ItemService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = ItemRepository(db)

    async def create_item(self, payload: ItemCreate, owner: User) -> Item:
        item = Item(
            title=payload.title,
            description=payload.description,
            is_published=payload.is_published,
            owner_id=owner.id,
        )
        return await self._repo.create(item)

    async def get_item(self, item_id: int) -> Item:
        item = await self._repo.get_by_id(item_id)
        if item is None:
            raise NotFoundException(f"Item {item_id} not found.")
        return item

    async def list_items(self, *, skip: int = 0, limit: int = 20) -> tuple[list[Item], int]:
        items = await self._repo.get_all(skip=skip, limit=limit)
        total = await self._repo.count()
        return items, total

    async def list_my_items(
        self, owner_id: int, *, skip: int = 0, limit: int = 20
    ) -> tuple[list[Item], int]:
        items = await self._repo.get_by_owner(owner_id, skip=skip, limit=limit)
        total = await self._repo.count_by_owner(owner_id)
        return items, total

    async def update_item(
        self, item_id: int, payload: ItemUpdate, requesting_user: User
    ) -> Item:
        item = await self.get_item(item_id)
        self._assert_ownership(item, requesting_user)
        update_data = payload.model_dump(exclude_none=True)
        return await self._repo.update(item, update_data)

    async def delete_item(self, item_id: int, requesting_user: User) -> None:
        item = await self.get_item(item_id)
        self._assert_ownership(item, requesting_user)
        await self._repo.delete(item)

    @staticmethod
    def _assert_ownership(item: Item, user: User) -> None:
        if item.owner_id != user.id and not user.is_superuser:
            raise ForbiddenException("You do not own this item.")
