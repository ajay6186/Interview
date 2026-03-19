# =============================================================================
# EXERCISE 06: Connection Pooling & Client Lifecycle  [LEVEL: Senior 5-6 yr]
# =============================================================================
# GOAL: Manage the httpx.AsyncClient at the application level for performance.
#
# THEORY:
#   Problem with `async with httpx.AsyncClient()` inside every endpoint:
#     - Creates AND destroys a TCP connection on every request
#     - DNS lookups happen every single time
#     - High overhead under load (thousands of req/sec)
#
#   Solution: ONE shared AsyncClient for the entire app lifetime.
#     - Reuses TCP connections (HTTP/1.1 keep-alive, HTTP/2 multiplexing)
#     - Connection pool handles concurrency safely
#     - Must be properly closed on app shutdown
#
#   FastAPI Lifespan (recommended in FastAPI 0.95+):
#     from contextlib import asynccontextmanager
#
#     @asynccontextmanager
#     async def lifespan(app: FastAPI):
#         # Startup: runs before the server starts accepting requests
#         app.state.client = httpx.AsyncClient(...)
#         yield
#         # Shutdown: runs after the server stops
#         await app.state.client.aclose()
#
#     app = FastAPI(lifespan=lifespan)
#
#   In endpoints, access via:
#     from fastapi import Request
#     async def my_endpoint(request: Request):
#         client = request.app.state.client
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException

BASE_URL = "https://jsonplaceholder.typicode.com"


# TODO 1: Create a lifespan context manager
#   - On startup: create a shared httpx.AsyncClient with:
#       timeout=10.0
#       limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
#   - Store it in app.state.http_client
#   - On shutdown: call await app.state.http_client.aclose()
#   Hint:
#     @asynccontextmanager
#     async def lifespan(app: FastAPI):
#         app.state.http_client = httpx.AsyncClient(...)
#         yield
#         await app.state.http_client.aclose()


# TODO 2: Create the FastAPI app using the lifespan
#   app = FastAPI(title="Connection Pooling", lifespan=lifespan)


# TODO 3: Create GET /users/{user_id}
#   - Get the shared client from request.app.state.http_client
#   - Use it (without `async with` — it's already open!)
#   - Return the user JSON (handle 404)
#   Hint:
#     client = request.app.state.http_client
#     response = await client.get(...)


# TODO 4: Create GET /pool-stats
#   - Return info about the connection pool
#   - Access: request.app.state.http_client._transport._pool
#   - Return {"info": "Connection pool is active and shared across all requests"}
#     (Just return a friendly info message — pool internals are not public API)
