"""
Flask test examples — covers fixtures, auth, CRUD, error handling.
Run: pytest tests/ -v
"""
import pytest
from app import create_app, db, User


@pytest.fixture
def app():
    """Create app with test config (in-memory SQLite)."""
    app = create_app(config_name="testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client — no real HTTP server needed."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register + login, return auth headers."""
    client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    })
    resp = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "password123",
    })
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ──
class TestAuth:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
        })
        assert resp.status_code == 201
        assert resp.get_json()["user"]["username"] == "newuser"

    def test_register_duplicate(self, client):
        payload = {"username": "dup", "email": "dup@test.com", "password": "password123"}
        client.post("/api/auth/register", json=payload)
        resp = client.post("/api/auth/register", json=payload)
        assert resp.status_code == 409

    def test_register_validation(self, client):
        resp = client.post("/api/auth/register", json={
            "username": "ab",  # too short
            "email": "not-an-email",
            "password": "123",  # too short
        })
        assert resp.status_code == 422

    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "username": "user1", "email": "u@t.com", "password": "password123"
        })
        resp = client.post("/api/auth/login", json={
            "username": "user1", "password": "password123"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.get_json()

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "username": "user2", "email": "u2@t.com", "password": "password123"
        })
        resp = client.post("/api/auth/login", json={
            "username": "user2", "password": "wrong"
        })
        assert resp.status_code == 401

    def test_me_authenticated(self, client, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["user"]["username"] == "testuser"

    def test_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401


# ── Posts Tests ──
class TestPosts:
    def test_create_post(self, client, auth_headers):
        resp = client.post("/api/posts", json={
            "title": "Test Post", "body": "Hello World", "published": True
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.get_json()["post"]["title"] == "Test Post"

    def test_list_posts(self, client, auth_headers):
        # Create a published post
        client.post("/api/posts", json={
            "title": "Post 1", "body": "Body", "published": True
        }, headers=auth_headers)
        resp = client.get("/api/posts")
        data = resp.get_json()
        assert resp.status_code == 200
        assert len(data["posts"]) == 1
        assert "meta" in data

    def test_get_post(self, client, auth_headers):
        create_resp = client.post("/api/posts", json={
            "title": "Single", "body": "Body", "published": True
        }, headers=auth_headers)
        post_id = create_resp.get_json()["post"]["id"]
        resp = client.get(f"/api/posts/{post_id}")
        assert resp.status_code == 200

    def test_update_post(self, client, auth_headers):
        create_resp = client.post("/api/posts", json={
            "title": "Old Title", "body": "Body", "published": True
        }, headers=auth_headers)
        post_id = create_resp.get_json()["post"]["id"]
        resp = client.put(f"/api/posts/{post_id}", json={
            "title": "New Title"
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["post"]["title"] == "New Title"

    def test_delete_post(self, client, auth_headers):
        create_resp = client.post("/api/posts", json={
            "title": "Delete Me", "body": "Body"
        }, headers=auth_headers)
        post_id = create_resp.get_json()["post"]["id"]
        resp = client.delete(f"/api/posts/{post_id}", headers=auth_headers)
        assert resp.status_code == 200

    def test_create_post_unauthenticated(self, client):
        resp = client.post("/api/posts", json={"title": "X", "body": "Y"})
        assert resp.status_code == 401

    def test_404_post(self, client):
        resp = client.get("/api/posts/9999")
        assert resp.status_code == 404


# ── Misc Tests ──
class TestMisc:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "healthy"

    def test_index(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "endpoints" in resp.get_json()

    def test_response_headers(self, client):
        resp = client.get("/health")
        assert "X-Response-Time" in resp.headers
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
