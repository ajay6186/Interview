"""
Exercise 15 — Parametrize validation tests
============================================
Goal: Replace multiple single-case test functions with a single parametrized test.

This is a pytest file — run it with:
  pytest practice/exercises/ex15_parametrize_test.py -v

TODO: Fill in the parametrize decorator and the test body below.
      The first 5 cases should return 422.
      The last case (valid payload) should return 201.
"""
import pytest
from httpx import AsyncClient


# ── TODO: fill in the test cases ─────────────────────────────────────────────
@pytest.mark.asyncio
@pytest.mark.parametrize("payload,expected_status", [
    # (payload_dict, expected_http_status)
    # TODO: add 5 invalid cases (422) + 1 valid case (201)
    # Example invalid: bad email, weak password, short username, etc.
    # Replace the line below:
    ({"TODO": True}, 0),   # ← remove this and add real cases
])
async def test_registration_validation(
    client: AsyncClient,
    payload: dict,
    expected_status: int,
) -> None:
    # TODO: POST to the register endpoint and assert the status code
    response = await client.post("/api/v1/users/", json=payload)
    assert response.status_code == expected_status, (
        f"Expected {expected_status}, got {response.status_code}. "
        f"Body: {response.text[:200]}"
    )
