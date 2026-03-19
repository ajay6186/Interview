# Exercise 3 Solution — Search items by title

---

## Step 1 — Repository (`app/repositories/item_repository.py`)

```python
async def search(
    self, q: str, *, skip: int = 0, limit: int = 20
) -> list[Item]:
    result = await self.db.execute(
        select(Item)
        .where(Item.title.ilike(f"%{q}%"))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())

async def count_search(self, q: str) -> int:
    result = await self.db.execute(
        select(func.count())
        .select_from(Item)
        .where(Item.title.ilike(f"%{q}%"))
    )
    return result.scalar_one()
```

---

## Step 2 — Service (`app/services/item_service.py`)

```python
async def list_items(
    self,
    *,
    skip: int = 0,
    limit: int = 20,
    q: str | None = None,   # ← add this
) -> tuple[list[Item], int]:
    if q:
        items = await self._repo.search(q, skip=skip, limit=limit)
        total = await self._repo.count_search(q)
    else:
        items = await self._repo.get_all(skip=skip, limit=limit)
        total = await self._repo.count()
    return items, total
```

---

## Step 3 — Endpoint (`app/api/v1/endpoints/items.py`)

```python
from fastapi import Query

@router.get("/", response_model=PaginatedResponse[ItemListResponse])
async def list_items(
    db: DBSession,
    pagination: PaginationDep,
    q: str | None = Query(default=None, description="Search items by title"),
) -> PaginatedResponse[ItemListResponse]:
    service = ItemService(db)
    items, total = await service.list_items(
        skip=pagination.skip, limit=pagination.limit, q=q
    )
    return PaginatedResponse.create(
        items=[ItemListResponse.model_validate(i) for i in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
```

---

## Bonus — Search title AND description

```python
from sqlalchemy import or_

async def search(self, q: str, *, skip: int = 0, limit: int = 20) -> list[Item]:
    pattern = f"%{q}%"
    result = await self.db.execute(
        select(Item)
        .where(or_(Item.title.ilike(pattern), Item.description.ilike(pattern)))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
```
