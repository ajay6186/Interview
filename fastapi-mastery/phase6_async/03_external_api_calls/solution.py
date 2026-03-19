# =============================================================================
# SOLUTION 03: Calling External APIs Async  [LEVEL: Intermediate 2-3 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="External API Calls")

BASE_URL = "https://jsonplaceholder.typicode.com"


@app.get("/users")
async def get_users():
    # Open an async HTTP client, make the call, return JSON
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/users")
        response.raise_for_status()  # Raises an error for 4xx/5xx responses
        return response.json()


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/users/{user_id}")

    # Propagate 404 from the upstream API to our caller
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")

    response.raise_for_status()
    return response.json()


@app.get("/posts/{post_id}/with-author")
async def get_post_with_author(post_id: int):
    async with httpx.AsyncClient() as client:
        # Step 1: fetch the post
        post_resp = await client.get(f"{BASE_URL}/posts/{post_id}")
        if post_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Post not found")
        post = post_resp.json()

        # Step 2: use userId from the post to fetch the author
        # These MUST be sequential because we need the post first
        user_resp = await client.get(f"{BASE_URL}/users/{post['userId']}")
        user_resp.raise_for_status()
        author = user_resp.json()

    return {"post": post, "author": author}


# KEY POINTS:
# - Use httpx.AsyncClient (not requests!) for async HTTP calls
# - `async with` ensures the client is properly closed after use
# - response.raise_for_status() converts HTTP errors into Python exceptions
# - Sequential calls: when call B depends on result from call A, do them in order
