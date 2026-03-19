"""
FastAPI test examples — covers async fixtures, TestClient, auth, CRUD.
Run: pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app import app, Base, get_db, settings

# ── Test DB setup ──
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_db():
    """Create/drop tables for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Async test client using httpx."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Register + login, return auth headers."""
    await client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    })
    resp = await client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ──
class TestAuth:
    @pytest.mark.asyncio
    async def test_register(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
        })
        assert resp.status_code == 201
        assert resp.json()["username"] == "newuser"

    @pytest.mark.asyncio
    async def test_register_duplicate(self, client: AsyncClient):
        payload = {"username": "dup", "email": "dup@test.com", "password": "password123"}
        await client.post("/api/auth/register", json=payload)
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_register_validation(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "username": "ab",  # too short
            "email": "bad-email",
            "password": "12",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login(self, client: AsyncClient):
        await client.post("/api/auth/register", json={
            "username": "u1", "email": "u1@t.com", "password": "password123"
        })
        resp = await client.post("/api/auth/login", json={
            "username": "u1", "password": "password123"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/auth/register", json={
            "username": "u2", "email": "u2@t.com", "password": "password123"
        })
        resp = await client.post("/api/auth/login", json={
            "username": "u2", "password": "wrong"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_me(self, client: AsyncClient, auth_headers):
        resp = await client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    @pytest.mark.asyncio
    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401


# ── Posts Tests ──
class TestPosts:
    @pytest.mark.asyncio
    async def test_create_post(self, client: AsyncClient, auth_headers):
        resp = await client.post("/api/posts", json={
            "title": "Test Post", "body": "Hello World", "published": True
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["title"] == "Test Post"

    @pytest.mark.asyncio
    async def test_list_posts(self, client: AsyncClient, auth_headers):
        await client.post("/api/posts", json={
            "title": "P1", "body": "Body", "published": True
        }, headers=auth_headers)
        resp = await client.get("/api/posts")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    @pytest.mark.asyncio
    async def test_get_post(self, client: AsyncClient, auth_headers):
        create_resp = await client.post("/api/posts", json={
            "title": "Single", "body": "Body", "published": True
        }, headers=auth_headers)
        post_id = create_resp.json()["id"]
        resp = await client.get(f"/api/posts/{post_id}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_post(self, client: AsyncClient, auth_headers):
        create_resp = await client.post("/api/posts", json={
            "title": "Old", "body": "Body", "published": True
        }, headers=auth_headers)
        post_id = create_resp.json()["id"]
        resp = await client.put(f"/api/posts/{post_id}", json={
            "title": "New Title"
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_delete_post(self, client: AsyncClient, auth_headers):
        create_resp = await client.post("/api/posts", json={
            "title": "Del", "body": "Body"
        }, headers=auth_headers)
        post_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/posts/{post_id}", headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_404_post(self, client: AsyncClient):
        resp = await client.get("/api/posts/9999")
        assert resp.status_code == 404


# ── System Tests ──
class TestSystem:
    @pytest.mark.asyncio
    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_root(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "docs" in resp.json()

    @pytest.mark.asyncio
    async def test_swagger_docs(self, client: AsyncClient):
        resp = await client.get("/docs")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_timing_header(self, client: AsyncClient):
        resp = await client.get("/health")
        assert "x-response-time" in resp.headers
