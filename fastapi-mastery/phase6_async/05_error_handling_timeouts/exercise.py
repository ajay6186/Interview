# =============================================================================
# EXERCISE 05: Timeouts, Retry & Error Handling  [LEVEL: Mid-Senior 4-5 yr]
# =============================================================================
# GOAL: Write robust async code that handles failures gracefully.
#
# THEORY:
#   Real external APIs can:
#     - Timeout (server too slow)
#     - Return 4xx / 5xx errors
#     - Fail with network errors (DNS failure, connection reset)
#
#   httpx Timeout:
#     httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=2.0)
#     or shorthand: httpx.Timeout(10.0)  ← applies to all phases
#
#   httpx Exceptions to catch:
#     httpx.TimeoutException   → request timed out
#     httpx.ConnectError       → could not connect (DNS, refused)
#     httpx.HTTPStatusError    → raise_for_status() raised (4xx / 5xx)
#     httpx.RequestError       → base class for all network errors
#
#   Simple Retry Pattern:
#     for attempt in range(max_retries):
#         try:
#             return await make_call()
#         except httpx.RequestError:
#             if attempt == max_retries - 1:
#                 raise
#             await asyncio.sleep(2 ** attempt)  # exponential back-off: 1s, 2s, 4s
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import asyncio
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Error Handling & Timeouts")

BASE_URL = "https://jsonplaceholder.typicode.com"


# TODO 1: Create GET /safe-user/{user_id}
#   - Set a 5-second timeout on the httpx.AsyncClient
#     Hint: httpx.AsyncClient(timeout=5.0)
#   - Catch httpx.TimeoutException → raise HTTPException 504 "Upstream timeout"
#   - Catch httpx.ConnectError     → raise HTTPException 503 "Service unavailable"
#   - If status code 404            → raise HTTPException 404 "User not found"
#   - Otherwise return user JSON


# TODO 2: Create GET /resilient-user/{user_id}
#   - Retry up to 3 times with exponential back-off (1s, 2s, 4s)
#   - On final failure raise HTTPException 503
#   - On success return the user JSON
#   Hint: Use a for loop with asyncio.sleep(2 ** attempt) in the except block


# TODO 3: Create GET /best-effort-dashboard/{user_id}
#   Use asyncio.gather with return_exceptions=True to fetch user + posts concurrently.
#   If a call fails, return None for that field instead of crashing the whole request.
#   Return:
#   {
#     "user": {...} or None,
#     "posts": [...] or None,
#     "errors": ["user fetch failed", ...]   # list any failures
#   }
#   Hint: asyncio.gather(..., return_exceptions=True) returns Exception objects
#         instead of raising them — check isinstance(result, Exception)
