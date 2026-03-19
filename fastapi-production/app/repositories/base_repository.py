"""
Generic async repository base — thin wrapper over SQLAlchemy async session.
All domain-specific repositories inherit from this.
"""
from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, record_id: int) -> ModelT | None:
        return await self.db.get(self.model, record_id)

    async def get_all(self, *, skip: int = 0, limit: int = 20) -> list[ModelT]:
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()

    # ── Write ─────────────────────────────────────────────────────────────────

    async def create(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        await self.db.flush()   # get DB-generated id without committing
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelT, data: dict[str, Any]) -> ModelT:
        for field, value in data.items():
            if value is not None:
                setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.db.delete(obj)
        await self.db.flush()
