# =============================================================================
# EXERCISE 04: Concurrent API Calls with asyncio.gather  [LEVEL: Intermediate 3-4 yr]
# =============================================================================
# GOAL: Fire multiple API calls AT THE SAME TIME to cut total wait time.
#
# THEORY:
#   Sequential: call A → wait → call B → wait → call C → wait = slow
#   Concurrent: call A, B, C all fire at once → wait for ALL → = fast
#
#   asyncio.gather(*coroutines) runs coroutines concurrently and collects results.
#
#   Example:
#     results = await asyncio.gather(
#         client.get(url_a),
#         client.get(url_b),
#         client.get(url_c),
#     )
#     # results is a list: [resp_a, resp_b, resp_c]
#
# PERFORMANCE COMPARISON:
#   3 calls × 200ms each:
#     Sequential = 600ms
#     Concurrent = ~200ms   (3x faster!)
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import asyncio
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Concurrent API Calls")

BASE_URL = "https://jsonplaceholder.typicode.com"


# TODO 1: Create GET /dashboard/{user_id}
#   Fetch these THREE things CONCURRENTLY for a user:
#     - User info:  GET /users/{user_id}
#     - User posts: GET /posts?userId={user_id}
#     - User todos: GET /todos?userId={user_id}
#   Use asyncio.gather() to fire all three at once.
#   Return: {"user": ..., "posts": [...], "todos": [...]}
#   Hint:
#     user_resp, posts_resp, todos_resp = await asyncio.gather(
#         client.get(...), client.get(...), client.get(...)
#     )


# TODO 2: Create GET /compare-speed/{user_id}
#   Fetch user + posts + todos BOTH ways and time them:
#     1) Sequential:  3 separate awaits one after another
#     2) Concurrent:  asyncio.gather
#   Return:
#   {
#     "sequential_seconds": float,
#     "concurrent_seconds": float,
#     "speedup": "Xx faster"
#   }
#   Hint: import time, record time.time() before and after each approach


# TODO 3: Create GET /multi-users
#   Accept a query param: ids: str = "1,2,3"
#   Parse it into a list of integers.
#   Fetch ALL those users CONCURRENTLY.
#   Return a list of user dicts.
#   Hint: build a list of coroutines, then await asyncio.gather(*coroutines)
