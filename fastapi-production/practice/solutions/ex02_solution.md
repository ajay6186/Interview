# Exercise 2 Solution — Published items endpoint

---

## Step 1 — Repository (`app/repositories/item_repository.py`)

```python
async def count_published(self) -> int:
    result = await self.db.execute(
        select(func.count()).select_from(Item).where(Item.is_published.is_(True))
    )
    return result.scalar_one()
```

---

## Step 2 — Service (`app/services/item_service.py`)

```python
async def list_published_items(
    self, *, skip: int = 0, limit: int = 20
) -> tuple[list[Item], int]:
    items = await self._repo.get_published(skip=skip, limit=limit)
    total = await self._repo.count_published()
    return items, total
```

---

## Step 3 — Endpoint (`app/api/v1/endpoints/items.py`)

```python
@router.get(
    "/published",
    response_model=PaginatedResponse[ItemListResponse],
    summary="List published items (public)",
)
async def list_published_items(
    db: DBSession,
    pagination: PaginationDep,
) -> PaginatedResponse[ItemListResponse]:
    service = ItemService(db)
    items, total = await service.list_published_items(
        skip=pagination.skip, limit=pagination.limit
    )
    return PaginatedResponse.create(
        items=[ItemListResponse.model_validate(i) for i in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
```

**Important:** place `/published` route BEFORE `/{item_id}` in the file —
FastAPI matches routes in order and `/published` would otherwise be captured
as `item_id="published"`.

---

## Bonus — Filter by owner_id

```python
@router.get("/published")
async def list_published_items(
    db: DBSession,
    pagination: PaginationDep,
    owner_id: int | None = Query(default=None),
):
    service = ItemService(db)
    items, total = await service.list_published_items(
        skip=pagination.skip, limit=pagination.limit, owner_id=owner_id
    )
    ...
```

Add `owner_id: int | None = None` to the service + repo methods and filter with
`.where(Item.owner_id == owner_id)` when provided.
