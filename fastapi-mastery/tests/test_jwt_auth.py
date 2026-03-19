# =============================================================================
# test_jwt_auth.py — Production-level tests for Phase 5 JWT Auth
# =============================================================================
#
# CONCEPTS COVERED:
#   1.  Login flow testing   — POST form data, assert token shape
#   2.  Bearer auth          — Authorization header pattern
#   3.  Composed fixtures    — alice_token, alice_headers from conftest
#   4.  Testing disabled users — business rule enforcement
#   5.  Token tampering      — security boundary tests
#   6.  Expired token        — using monkeypatch to control time
#   7.  Dependency override  — bypassing auth entirely for endpoint unit tests
#
# RUN:
#   pytest tests/test_jwt_auth.py -v
#   pytest tests/test_jwt_auth.py -v -k "token"
#
# =============================================================================

import pytest
from datetime import timedelta


# =============================================================================
# 1. LOGIN ENDPOINT  — POST /token
# =============================================================================

class TestLogin:

    def test_valid_login_returns_200(self, auth_client):
        response = auth_client.post(
            "/token",
            data={"username": "alice", "password": "secret123"},
        )
        assert response.status_code == 200

    def test_token_shape(self, auth_client):
        """
        PATTERN — Schema test:
            Validate the exact contract of the response.
            If someone renames 'access_token' → 'token', this catches it.
        """
        body = auth_client.post(
            "/token",
            data={"username": "alice", "password": "secret123"},
        ).json()
        assert "access_token" in body
        assert "token_type" in body
        assert body["token_type"] == "bearer"

    def test_token_is_non_empty_string(self, auth_client):
        token = auth_client.post(
            "/token",
            data={"username": "alice", "password": "secret123"},
        ).json()["access_token"]
        assert isinstance(token, str)
        assert len(token) > 0

    def test_wrong_password_returns_401(self, auth_client):
        response = auth_client.post(
            "/token",
            data={"username": "alice", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_unknown_user_returns_401(self, auth_client):
        response = auth_client.post(
            "/token",
            data={"username": "nobody", "password": "whatever"},
        )
        assert response.status_code == 401

    def test_empty_credentials_returns_422(self, auth_client):
        """
        FastAPI form parsing → missing required fields → 422, not 401.
        """
        response = auth_client.post("/token", data={})
        assert response.status_code == 422

    @pytest.mark.parametrize("username,password", [
        ("alice", "SECRET123"),       # wrong case
        ("ALICE", "secret123"),       # username wrong case
        ("alice", ""),                # empty password
        ("alice", "secret12"),        # almost correct
    ])
    def test_bad_credentials_parametrized(self, auth_client, username, password):
        response = auth_client.post(
            "/token", data={"username": username, "password": password}
        )
        assert response.status_code in (401, 422)


# =============================================================================
# 2. PROTECTED ENDPOINT — GET /users/me
# =============================================================================

class TestGetMe:

    def test_me_with_valid_token(self, auth_client, alice_headers):
        """
        alice_headers comes from conftest — already logged in.
        This is the composed-fixture pattern in action.
        """
        response = auth_client.get("/users/me", headers=alice_headers)
        assert response.status_code == 200

    def test_me_returns_correct_user(self, auth_client, alice_headers):
        body = auth_client.get("/users/me", headers=alice_headers).json()
        assert body["username"] == "alice"
        assert body["email"] == "alice@example.com"

    def test_me_does_not_expose_password(self, auth_client, alice_headers):
        """
        SECURITY TEST — Never return raw or hashed passwords.
        The response_model=User excludes hashed_password.
        """
        body = auth_client.get("/users/me", headers=alice_headers).json()
        assert "password" not in body
        assert "hashed_password" not in body

    def test_me_without_token_returns_401(self, auth_client):
        response = auth_client.get("/users/me")
        assert response.status_code == 401

    def test_me_with_garbage_token_returns_401(self, auth_client):
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": "Bearer not.a.real.jwt"},
        )
        assert response.status_code == 401

    def test_me_with_tampered_token_returns_401(self, auth_client, alice_token):
        """
        PATTERN — Security boundary test:
            Take a valid token and flip one character. The signature check
            should reject it. Tests that JWT verification is actually working.
        """
        tampered = alice_token[:-4] + "XXXX"
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == 401

    def test_me_with_wrong_scheme_returns_401(self, auth_client, alice_token):
        """'Basic' instead of 'Bearer' — OAuth2 scheme mismatch."""
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Basic {alice_token}"},
        )
        assert response.status_code == 401


# =============================================================================
# 3. DISABLED USER — Bob
# =============================================================================

class TestDisabledUser:
    """
    Bob exists in the DB but has disabled=True.
    He can log in (get a token) but cannot access protected endpoints.
    """

    @pytest.fixture()
    def bob_token(self, auth_client):
        response = auth_client.post(
            "/token",
            data={"username": "bob", "password": "password456"},
        )
        assert response.status_code == 200, "Bob should still receive a token"
        return response.json()["access_token"]

    def test_disabled_user_can_login(self, bob_token):
        """Getting a token is the login step — disabled check happens on resource access."""
        assert bob_token is not None

    def test_disabled_user_cannot_access_me(self, auth_client, bob_token):
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {bob_token}"},
        )
        assert response.status_code == 400

    def test_disabled_user_error_detail(self, auth_client, bob_token):
        body = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {bob_token}"},
        ).json()
        assert body["detail"] == "Inactive user"


# =============================================================================
# 4. PROTECTED RESOURCE — GET /users/me/items
# =============================================================================

class TestMyItems:

    def test_items_requires_auth(self, auth_client):
        response = auth_client.get("/users/me/items")
        assert response.status_code == 401

    def test_items_returns_list(self, auth_client, alice_headers):
        items = auth_client.get("/users/me/items", headers=alice_headers).json()
        assert isinstance(items, list)
        assert len(items) > 0

    def test_items_belong_to_current_user(self, auth_client, alice_headers):
        """Items should be scoped to the logged-in user."""
        items = auth_client.get("/users/me/items", headers=alice_headers).json()
        for item in items:
            assert item["owner"] == "alice"


# =============================================================================
# 5. EXPIRED TOKEN TEST — using monkeypatch
# =============================================================================

class TestExpiredToken:
    """
    PATTERN — Time travel with monkeypatch:
        We cannot wait 30 minutes for a token to expire in a test.
        Instead, create a token with a -1 minute expiry (already expired),
        then assert the endpoint rejects it.
    """

    def test_expired_token_is_rejected(self, auth_client, auth_app):
        """
        auth_app is the module — we call create_access_token directly
        to forge an already-expired token.
        """
        expired_token = auth_app.create_access_token(
            data={"sub": "alice"},
            expires_delta=timedelta(minutes=-1),   # expired 1 minute ago
        )
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401

    def test_token_without_sub_is_rejected(self, auth_client, auth_app):
        """
        SECURITY TEST — A token missing the 'sub' claim should be rejected
        even if the signature is valid. Tests that claim validation is strict.
        """
        bad_token = auth_app.create_access_token(
            data={"role": "admin"},          # no 'sub' field
            expires_delta=timedelta(minutes=30),
        )
        response = auth_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert response.status_code == 401


# =============================================================================
# 6. UNIT TEST — helpers via dependency override
# =============================================================================

class TestEndpointWithOverride:
    """
    PATTERN — Pure endpoint unit test:
        Override get_current_active_user entirely. Now the test only verifies
        the endpoint's own logic (response shape, status), completely isolated
        from auth. Fast and deterministic.
    """

    def test_me_endpoint_returns_user_from_override(self, auth_client, auth_app):
        fake_user = {
            "username": "mock_user",
            "email": "mock@test.com",
            "disabled": False,
        }
        auth_app.app.dependency_overrides[
            auth_app.get_current_active_user
        ] = lambda: fake_user

        try:
            response = auth_client.get("/users/me")
            assert response.status_code == 200
            assert response.json()["username"] == "mock_user"
        finally:
            auth_app.app.dependency_overrides = {}

    def test_items_endpoint_scopes_to_injected_user(self, auth_client, auth_app):
        fake_user = {
            "username": "injected",
            "email": "injected@test.com",
            "disabled": False,
        }
        auth_app.app.dependency_overrides[
            auth_app.get_current_active_user
        ] = lambda: fake_user

        try:
            items = auth_client.get("/users/me/items").json()
            assert all(item["owner"] == "injected" for item in items)
        finally:
            auth_app.app.dependency_overrides = {}
