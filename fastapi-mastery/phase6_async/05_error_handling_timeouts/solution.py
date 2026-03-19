# =============================================================================
# SOLUTION 05: Timeouts, Retry & Error Handling  [LEVEL: Mid-Senior 4-5 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import asyncio
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Error Handling & Timeouts")

BASE_URL = "https://jsonplaceholder.typicode.com"


@app.get("/safe-user/{user_id}")
async def safe_get_user(user_id: int):
    """Fetch a user with proper timeout and error handling."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/users/{user_id}")

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")

        response.raise_for_status()  # Raises for 5xx errors
        return response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream API timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Could not connect to upstream API")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e.response.status_code}")


@app.get("/resilient-user/{user_id}")
async def resilient_get_user(user_id: int):
    """Fetch a user with automatic retry and exponential back-off."""
    max_retries = 3
    last_error: Exception = Exception("Unknown error")

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{BASE_URL}/users/{user_id}")
                response.raise_for_status()
                return response.json()

        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            last_error = e
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                await asyncio.sleep(wait)

    raise HTTPException(
        status_code=503,
        detail=f"Failed after {max_retries} retries: {str(last_error)}"
    )


@app.get("/best-effort-dashboard/{user_id}")
async def best_effort_dashboard(user_id: int):
    """Fetch multiple resources — partial failure is OK, return what we can."""

    async def fetch(client: httpx.AsyncClient, url: str):
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

    async with httpx.AsyncClient(timeout=5.0) as client:
        # return_exceptions=True means exceptions are returned as values, not raised
        results = await asyncio.gather(
            fetch(client, f"{BASE_URL}/users/{user_id}"),
            fetch(client, f"{BASE_URL}/posts?userId={user_id}"),
            return_exceptions=True,
        )

    user_result, posts_result = results
    errors = []

    user = None
    if isinstance(user_result, Exception):
        errors.append(f"user fetch failed: {user_result}")
    else:
        user = user_result

    posts = None
    if isinstance(posts_result, Exception):
        errors.append(f"posts fetch failed: {posts_result}")
    else:
        posts = posts_result

    return {"user": user, "posts": posts, "errors": errors}


# KEY POINTS:
# - Always set timeouts — no timeout = your server hangs forever on a slow upstream
# - Exponential back-off (1s, 2s, 4s) is standard retry practice
# - return_exceptions=True in gather() enables partial-success patterns
# - Never swallow ALL exceptions blindly — log them or return error details
