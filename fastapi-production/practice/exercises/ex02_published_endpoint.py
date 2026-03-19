"""
Exercise 2 — Published items endpoint
======================================
Goal: Add GET /api/v1/items/published — returns only published items, no auth needed.

Steps:
  1. Add count_published() to ItemRepository
  2. Add list_published_items() to ItemService
  3. Add the route to items.py endpoint file

Run this file to check your work:
  python practice/exercises/ex02_published_endpoint.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


async def check():
    errors = []

    # ── Check 1: route exists in the router ───────────────────────────────────
    from app.main import app
    routes = {r.path for r in app.routes}  # type: ignore[union-attr]
    target = "/api/v1/items/published"
    if target not in routes:
        errors.append(f"FAIL  Route {target!r} not found in app.routes")
    else:
        print(f"PASS  Route {target!r} is registered")

    # ── Check 2: service method exists ────────────────────────────────────────
    from app.services.item_service import ItemService
    if not hasattr(ItemService, "list_published_items"):
        errors.append("FAIL  ItemService is missing list_published_items()")
    else:
        print("PASS  ItemService.list_published_items() exists")

    # ── Check 3: repo method count_published exists ───────────────────────────
    from app.repositories.item_repository import ItemRepository
    if not hasattr(ItemRepository, "count_published"):
        errors.append("FAIL  ItemRepository is missing count_published()")
    else:
        print("PASS  ItemRepository.count_published() exists")

    # ── Check 4: live HTTP test ───────────────────────────────────────────────
    try:
        import httpx
        from httpx import ASGITransport, AsyncClient
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
        from app.core.database import Base, get_db
        from app.models.item import Item
        from app.models.user import User
        from app.core.security import hash_password

        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with SessionLocal() as seed_session:
            user = User(email="a@b.com", username="ab", hashed_password=hash_password("Password1"), is_active=True)
            seed_session.add(user)
            await seed_session.flush()
            seed_session.add(Item(title="Public", is_published=True, owner_id=user.id))
            seed_session.add(Item(title="Draft",  is_published=False, owner_id=user.id))
            await seed_session.commit()

        async def override_db():
            async with SessionLocal() as s:
                yield s

        app.dependency_overrides[get_db] = override_db
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/items/published")

        app.dependency_overrides.clear()
        await engine.dispose()

        if resp.status_code != 200:
            errors.append(f"FAIL  GET /api/v1/items/published returned {resp.status_code}, expected 200")
        else:
            data = resp.json()
            titles = [i["title"] for i in data.get("items", [])]
            if "Public" not in titles:
                errors.append("FAIL  Published item missing from response")
            elif "Draft" in titles:
                errors.append("FAIL  Draft item should NOT appear in /published response")
            else:
                print("PASS  /published returns only published items")
    except ImportError:
        errors.append("SKIP  httpx not installed — run: pip install httpx")

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    if errors:
        for e in errors:
            print(e)
        print(f"\n{len(errors)} check(s) failed — keep going!")
        sys.exit(1)
    else:
        print("All checks passed! Exercise 2 complete.")


if __name__ == "__main__":
    asyncio.run(check())
