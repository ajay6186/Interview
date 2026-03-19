# =============================================================================
# conftest.py — Shared pytest fixtures (loaded automatically by pytest)
# =============================================================================
#
# WHAT IS conftest.py?
#   A special pytest file. Any fixture defined here is available to ALL test
#   files in the same directory and below — no import needed.
#
# FIXTURE SCOPES (how long a fixture lives):
#   "function"  → created/destroyed for each test  (DEFAULT — safest)
#   "class"     → shared within a test class
#   "module"    → shared within a test file
#   "session"   → shared across the entire test run (use only for expensive setup)
#
# =============================================================================

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# CRUD app (phase2 / exercise 06)
# ---------------------------------------------------------------------------
import importlib
import sys


@pytest.fixture()
def crud_client():
    """
    Returns a fresh TestClient for the CRUD app.

    KEY PATTERN — State Isolation:
        The CRUD solution uses module-level globals (products_db, next_id).
        If we reuse the same module across tests, state bleeds between them.
        We reload the module for every test so each test starts clean.
    """
    # Force a fresh module import so globals are reset on every test.
    mod_name = "phase2_http.06_crud_operations.solution"
    # Python identifiers can't start with digits, so we use importlib directly.
    import importlib.util, pathlib

    spec = importlib.util.spec_from_file_location(
        "crud_solution",
        pathlib.Path(__file__).parent.parent
        / "phase2_http/06_crud_operations/solution.py",
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    client = TestClient(module.app)
    yield client
    # Nothing to tear down — module is GC'd after test.


# ---------------------------------------------------------------------------
# Nested-dependencies app (phase4 / exercise 12)
# ---------------------------------------------------------------------------
@pytest.fixture()
def dep_client():
    """TestClient for the nested-dependencies app (no state to reset)."""
    import importlib.util, pathlib

    spec = importlib.util.spec_from_file_location(
        "dep_solution",
        pathlib.Path(__file__).parent.parent
        / "phase4_dependencies/12_nested_dependencies/solution.py",
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    client = TestClient(module.app)
    yield client, module  # yield BOTH so tests can call dependency_overrides


# ---------------------------------------------------------------------------
# JWT auth app (phase5 / exercise 13)
# ---------------------------------------------------------------------------
@pytest.fixture()
def auth_app():
    """Returns the auth FastAPI app (module re-loaded each test)."""
    import importlib.util, pathlib

    spec = importlib.util.spec_from_file_location(
        "auth_solution",
        pathlib.Path(__file__).parent.parent
        / "phase5_security/13_jwt_auth/solution.py",
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture()
def auth_client(auth_app):
    """TestClient for the JWT auth app."""
    return TestClient(auth_app.app)


@pytest.fixture()
def alice_token(auth_client):
    """
    Helper fixture: logs in as 'alice' and returns a valid Bearer token.

    PATTERN — Composed fixtures:
        Fixtures can depend on other fixtures. pytest resolves the chain
        automatically. This avoids duplicating login logic in every test.
    """
    response = auth_client.post(
        "/token",
        data={"username": "alice", "password": "secret123"},
    )
    assert response.status_code == 200, "Setup failed: alice login"
    return response.json()["access_token"]


@pytest.fixture()
def alice_headers(alice_token):
    """Returns Authorization header dict ready to pass to client calls."""
    return {"Authorization": f"Bearer {alice_token}"}
