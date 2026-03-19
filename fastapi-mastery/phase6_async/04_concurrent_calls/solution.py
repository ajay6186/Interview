# =============================================================================
# SOLUTION 04: Concurrent API Calls with asyncio.gather  [LEVEL: Intermediate 3-4 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import asyncio
import time
import httpx
from fastapi import FastAPI, Query

app = FastAPI(title="Concurrent API Calls")

BASE_URL = "https://jsonplaceholder.typicode.com"


@app.get("/dashboard/{user_id}")
async def get_dashboard(user_id: int):
    """Fetch user, posts, and todos concurrently — all in parallel."""
    async with httpx.AsyncClient() as client:
        # Fire all 3 requests at the same time
        user_resp, posts_resp, todos_resp = await asyncio.gather(
            client.get(f"{BASE_URL}/users/{user_id}"),
            client.get(f"{BASE_URL}/posts?userId={user_id}"),
            client.get(f"{BASE_URL}/todos?userId={user_id}"),
        )

    return {
        "user": user_resp.json(),
        "posts": posts_resp.json(),
        "todos": todos_resp.json(),
    }


@app.get("/compare-speed/{user_id}")
async def compare_speed(user_id: int):
    """Side-by-side benchmark: sequential vs concurrent fetching."""
    async with httpx.AsyncClient() as client:

        # --- Sequential approach ---
        seq_start = time.perf_counter()
        await client.get(f"{BASE_URL}/users/{user_id}")
        await client.get(f"{BASE_URL}/posts?userId={user_id}")
        await client.get(f"{BASE_URL}/todos?userId={user_id}")
        seq_time = round(time.perf_counter() - seq_start, 3)

        # --- Concurrent approach ---
        con_start = time.perf_counter()
        await asyncio.gather(
            client.get(f"{BASE_URL}/users/{user_id}"),
            client.get(f"{BASE_URL}/posts?userId={user_id}"),
            client.get(f"{BASE_URL}/todos?userId={user_id}"),
        )
        con_time = round(time.perf_counter() - con_start, 3)

    speedup = round(seq_time / con_time, 1) if con_time > 0 else 0

    return {
        "sequential_seconds": seq_time,
        "concurrent_seconds": con_time,
        "speedup": f"{speedup}x faster",
    }


@app.get("/multi-users")
async def get_multi_users(ids: str = Query(default="1,2,3", description="Comma-separated user IDs")):
    """Fetch multiple users concurrently from a comma-separated ID list."""
    user_ids = [int(i.strip()) for i in ids.split(",")]

    async with httpx.AsyncClient() as client:
        # Build a list of coroutines dynamically, then gather them all
        responses = await asyncio.gather(
            *[client.get(f"{BASE_URL}/users/{uid}") for uid in user_ids]
        )

    return [resp.json() for resp in responses]


# KEY POINTS:
# - asyncio.gather() runs all coroutines CONCURRENTLY (not in separate threads)
# - Results come back in the SAME ORDER as the input coroutines
# - Use *[list] unpacking to gather a dynamic number of coroutines
# - One shared AsyncClient per request is efficient (reuses TCP connection)
