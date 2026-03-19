"""
Exercise 3 — Search items by title
====================================
Goal: Add ?q= query param to GET /api/v1/items/ for case-insensitive title search.

Steps:
  1. Add search(q, skip, limit) + count_search(q) to ItemRepository
  2. Update ItemService.list_items() to accept an optional q: str | None
  3. Add q: str | None = Query(default=None) param to the list_items route

Run this file to check your work:
  python practice/exercises/ex03_search.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


async def check():
    errors = []

    # ── Check 1: repo has search method ───────────────────────────────────────
    from app.repositories.item_repository import ItemRepository
    if not hasattr(ItemRepository, "search"):
        errors.append("FAIL  ItemRepository is missing search() method")
    else:
        print("PASS  ItemRepository.search() exists")

    # ── Check 2: service list_items accepts q param ───────────────────────────
    import inspect
    from app.services.item_service import ItemService
    sig = inspect.signature(ItemService.list_items)
    if "q" not in sig.parameters:
        errors.append("FAIL  ItemService.list_items() must accept a 'q' keyword argument")
    else:
        print("PASS  ItemService.list_items() accepts q param")

    # ── Check 3: live search test ─────────────────────────────────────────────
    try:
        from httpx import ASGITransport, AsyncClient
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.main import app
        from app.core.database import Base, get_db
        from app.models.item import Item
        from app.models.user import User
        from app.core.security import hash_password

        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with SessionLocal() as s:
            user = User(email="x@x.com", username="xu", hashed_password=hash_password("Password1"), is_active=True)
            s.add(user)
            await s.flush()
            s.add(Item(title="Python tutorial", is_published=True, owner_id=user.id))
            s.add(Item(title="FastAPI guide",   is_published=True, owner_id=user.id))
            s.add(Item(title="SQLAlchemy ORM",  is_published=True, owner_id=user.id))
            await s.commit()

        async def override_db():
            async with SessionLocal() as sess:
                yield sess

        app.dependency_overrides[get_db] = override_db
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # search for "python" — case-insensitive
            r1 = await client.get("/api/v1/items/?q=python")
            # search with no match
            r2 = await client.get("/api/v1/items/?q=doesnotexist")
            # no filter
            r3 = await client.get("/api/v1/items/")

        app.dependency_overrides.clear()
        await engine.dispose()

        if r1.status_code != 200:
            errors.append(f"FAIL  ?q=python returned {r1.status_code}")
        else:
            items = r1.json().get("items", [])
            titles = [i["title"] for i in items]
            if not any("python" in t.lower() for t in titles):
                errors.append("FAIL  ?q=python should return 'Python tutorial'")
            elif any("FastAPI" in t for t in titles):
                errors.append("FAIL  ?q=python should NOT return 'FastAPI guide'")
            else:
                print("PASS  ?q=python returns only matching items (case-insensitive)")

        if r2.status_code != 200 or r2.json().get("total", -1) != 0:
            errors.append("FAIL  ?q=doesnotexist should return 200 with total=0")
        else:
            print("PASS  ?q=doesnotexist returns empty result with total=0")

        if r3.json().get("total", 0) >= 3:
            print("PASS  No filter returns all items")
        else:
            errors.append("FAIL  No filter should return all items")

    except ImportError as e:
        errors.append(f"SKIP  dependency missing — {e}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    if errors:
        for e in errors:
            print(e)
        print(f"\n{len(errors)} check(s) failed — keep going!")
        sys.exit(1)
    else:
        print("All checks passed! Exercise 3 complete.")


if __name__ == "__main__":
    asyncio.run(check())
