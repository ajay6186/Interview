"""
Test configuration and shared fixtures.

Key design decisions:
- Uses an in-memory SQLite database so tests are fully isolated.
- Each test function gets a fresh DB session via function-scoped `db` fixture.
- `client` is an async httpx.AsyncClient configured with the app's base URL.
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.item import Item
from app.models.user import User

# ── In-memory SQLite for tests ────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── DB fixtures ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    """
    Provide a transactional DB session that is rolled back after each test.
    This keeps tests fully isolated without truncating tables.
    """
    async with test_engine.connect() as connection:
        await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await connection.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncClient:
    """
    Async HTTP client with the real FastAPI app, but using the test DB session.
    """
    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Helper factories ──────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def regular_user(db: AsyncSession) -> User:
    user = User(
        email="user@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=hash_password("Password1"),
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def superuser(db: AsyncSession) -> User:
    user = User(
        email="admin@example.com",
        username="adminuser",
        full_name="Admin User",
        hashed_password=hash_password("Password1"),
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def regular_user_token(regular_user: User) -> str:
    return create_access_token(regular_user.id)


@pytest_asyncio.fixture
async def superuser_token(superuser: User) -> str:
    return create_access_token(superuser.id)


@pytest_asyncio.fixture
async def sample_item(db: AsyncSession, regular_user: User) -> Item:
    item = Item(
        title="Sample Item",
        description="A sample item for testing",
        is_published=False,
        owner_id=regular_user.id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


# ── Auth header helper ────────────────────────────────────────────────────────

def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
