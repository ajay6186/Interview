# =============================================================================
# test_dependencies.py — Production-level tests for Phase 4 (Dependencies)
# =============================================================================
#
# CONCEPTS COVERED:
#   1.  Dependency overrides  — swap real deps with test doubles
#   2.  Yield dependency testing — verifying teardown happens
#   3.  Header injection     — passing custom headers in tests
#   4.  Testing auth chains  — valid / invalid / missing token
#   5.  Test doubles         — fake objects instead of real resources
#
# KEY INSIGHT:
#   FastAPI's `app.dependency_overrides` is THE production pattern for
#   unit-testing endpoints. It lets you replace ANY dependency (DB, auth,
#   external service) without touching application code.
#
# RUN:
#   pytest tests/test_dependencies.py -v
#
# =============================================================================

import pytest


# =============================================================================
# HELPER — reusable test doubles
# =============================================================================

class FakeDBStub:
    """
    PATTERN — Test Double / Fake:
        A lightweight stand-in for FakeDB. Has the same interface (.query)
        but returns controlled, predictable data.
        Never use production data in unit tests.

        NOTE: Named FakeDBStub (not TestDB) because pytest auto-collects
        classes whose names start with 'Test' — avoid that naming.
    """
    def __init__(self, data=None):
        self.connected = True
        self.data = data or {
            "users": [{"id": 99, "name": "TestUser"}],
            "products": [{"id": 88, "name": "TestProduct"}],
        }
        self.close_called = False  # lets us assert teardown ran

    def query(self, table):
        return self.data.get(table, [])

    def close(self):
        self.connected = False
        self.close_called = True


# =============================================================================
# 1. /users AND /products ENDPOINTS (yield dependency)
# =============================================================================

class TestYieldDependency:
    """Tests for endpoints that use get_db() as a yield dependency."""

    def test_users_returns_200(self, dep_client):
        client, _ = dep_client
        response = client.get("/users")
        assert response.status_code == 200

    def test_users_returns_list(self, dep_client):
        client, _ = dep_client
        data = client.get("/users").json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_products_returns_200(self, dep_client):
        client, module = dep_client
        response = client.get("/products")
        assert response.status_code == 200

    def test_dependency_override_replaces_db(self, dep_client):
        """
        CORE PATTERN — Dependency Override:

            Real code:   endpoint -> get_db() -> FakeDB()
            Test code:   endpoint -> override_get_db() -> TestDB()

            The endpoint never knows the difference. This means:
            - Tests don't need a real database
            - Tests are fast and deterministic
            - You can inject failure scenarios
        """
        client, module = dep_client
        test_db = FakeDBStub(data={"users": [{"id": 777, "name": "Overridden"}]})

        def override_get_db():
            yield test_db

        # Wire the override
        module.app.dependency_overrides[module.get_db] = override_get_db

        try:
            users = client.get("/users").json()
            assert len(users) == 1
            assert users[0]["id"] == 777
            assert users[0]["name"] == "Overridden"
        finally:
            # ALWAYS clean up overrides — otherwise they leak into other tests
            module.app.dependency_overrides = {}

    def test_override_empty_db(self, dep_client):
        """Simulate an empty database — edge case."""
        client, module = dep_client

        def empty_db():
            yield FakeDBStub(data={"users": [], "products": []})

        module.app.dependency_overrides[module.get_db] = empty_db
        try:
            users = client.get("/users").json()
            assert users == []
        finally:
            module.app.dependency_overrides = {}

    def test_override_isolated_between_tests(self, dep_client):
        """
        PATTERN — Override cleanup verification:
            After override cleanup, the real dependency should be restored.
            This test proves state doesn't leak from the previous test.
        """
        client, module = dep_client
        # No override set — should use real FakeDB with seed data
        users = client.get("/users").json()
        names = [u["name"] for u in users]
        assert "Alice" in names or "alice" in [n.lower() for n in names]


# =============================================================================
# 2. /me ENDPOINT (nested dependency chain)
# =============================================================================

class TestNestedDependency:
    """
    Dependency chain: get_current_user -> get_token -> Header(X-Token)

    Testing nested deps means you can either:
      a) Pass the real header all the way through (integration-style)
      b) Override the top-level dep (unit-style)
    Both approaches are shown below.
    """

    VALID_TOKEN = "secret-token"

    def test_me_with_valid_token_returns_200(self, dep_client):
        """Integration-style: pass the real header through the full chain."""
        client, _ = dep_client
        response = client.get("/me", headers={"X-Token": self.VALID_TOKEN})
        assert response.status_code == 200

    def test_me_returns_username(self, dep_client):
        client, _ = dep_client
        body = client.get("/me", headers={"X-Token": self.VALID_TOKEN}).json()
        assert "username" in body

    def test_me_without_token_returns_422(self, dep_client):
        """
        Missing header -> FastAPI returns 422 (required field missing),
        not 401. The 401 only fires when the header is present but wrong.
        """
        client, _ = dep_client
        response = client.get("/me")
        assert response.status_code == 422

    def test_me_with_invalid_token_returns_401(self, dep_client):
        client, _ = dep_client
        response = client.get("/me", headers={"X-Token": "wrong-token"})
        assert response.status_code == 401

    def test_me_401_detail_message(self, dep_client):
        client, _ = dep_client
        body = client.get("/me", headers={"X-Token": "bad"}).json()
        assert "detail" in body
        assert body["detail"] == "Invalid token"

    def test_me_via_dependency_override(self, dep_client):
        """
        PATTERN — Override the WHOLE chain:
            If get_current_user is expensive (real JWT decode, DB lookup),
            override it entirely and return a fake user dict.
            This makes the test a pure unit test of the endpoint logic.
        """
        client, module = dep_client
        fake_user = {"username": "test_alice", "token": "fake"}

        module.app.dependency_overrides[module.get_current_user] = lambda: fake_user
        try:
            body = client.get("/me").json()
            assert body["username"] == "test_alice"
        finally:
            module.app.dependency_overrides = {}

    @pytest.mark.parametrize("token", [
        "",
        "   ",
        "wrong-token",
        "SECRET-TOKEN",          # case-sensitive
        "secret_token",          # underscore vs hyphen
    ])
    def test_invalid_tokens_all_return_401(self, dep_client, token):
        """Parametrize covers multiple bad-token scenarios in one test."""
        client, _ = dep_client
        response = client.get("/me", headers={"X-Token": token})
        assert response.status_code == 401
