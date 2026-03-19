# =============================================================================
# EXERCISE 03: Calling External APIs Async  [LEVEL: Intermediate 2-3 yr]
# =============================================================================
# GOAL: Use httpx.AsyncClient to call real external APIs from your FastAPI app.
#
# THEORY:
#   - `requests` library is SYNC — never use it in async FastAPI endpoints
#   - `httpx` is the async-compatible replacement for `requests`
#   - Always use `async with httpx.AsyncClient() as client:` inside async endpoints
#   - The free JSONPlaceholder API (https://jsonplaceholder.typicode.com) is used
#     for practice — no API key needed
#
# INSTALL:
#   pip install httpx  (already in requirements.txt)
#
# ENDPOINTS TO BUILD:
#   GET /users         → fetch all users from JSONPlaceholder
#   GET /users/{id}    → fetch single user by ID
#   GET /posts/{id}    → fetch a post and its author in two sequential calls
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="External API Calls")

BASE_URL = "https://jsonplaceholder.typicode.com"


# TODO 1: Create GET /users
#   - Use httpx.AsyncClient to GET f"{BASE_URL}/users"
#   - Return the JSON response as a list
#   Hint:
#     async with httpx.AsyncClient() as client:
#         response = await client.get(url)
#         return response.json()

@app.get("/users")
async def get_users():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/users")
        response.raise_for_status()
        return response.json()


# TODO 2: Create GET /users/{user_id}
#   - Fetch a single user from f"{BASE_URL}/users/{user_id}"
#   - If response status is 404, raise HTTPException(status_code=404, detail="User not found")
#   - Otherwise return the user JSON
#   Hint: check response.status_code


# TODO 3: Create GET /posts/{post_id}/with-author
#   - First fetch the post from f"{BASE_URL}/posts/{post_id}"
#   - Extract userId from the post data
#   - Then fetch the user from f"{BASE_URL}/users/{userId}"
#   - Return combined: {"post": post_data, "author": user_data}
#   Note: These are SEQUENTIAL calls (one depends on the other's result)
