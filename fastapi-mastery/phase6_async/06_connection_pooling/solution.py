# =============================================================================
# SOLUTION 06: Connection Pooling & Client Lifecycle  [LEVEL: Senior 5-6 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import asyncio
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException

BASE_URL = "https://jsonplaceholder.typicode.com"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan handler: code before yield = startup, code after yield = shutdown.
    The shared client lives for the entire app lifetime.
    """
    # STARTUP
    app.state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=2.0),
        limits=httpx.Limits(
            max_connections=100,        # max open connections across all hosts
            max_keepalive_connections=20,  # max idle keep-alive connections
            keepalive_expiry=30,        # close idle connections after 30s
        ),
        # Optional: set default headers for every outgoing request
        headers={"User-Agent": "fastapi-mastery/1.0"},
    )
    print("HTTP client started")
    yield
    # SHUTDOWN
    await app.state.http_client.aclose()
    print("HTTP client closed")


app = FastAPI(title="Connection Pooling", lifespan=lifespan)


def get_client(request: Request) -> httpx.AsyncClient:
    """Helper to retrieve the shared client from app state."""
    return request.app.state.http_client


@app.get("/users/{user_id}")
async def get_user(user_id: int, request: Request):
    """Uses the shared connection pool — no new client created per request."""
    client = get_client(request)
    response = await client.get(f"{BASE_URL}/users/{user_id}")

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    response.raise_for_status()
    return response.json()


@app.get("/users")
async def get_users(request: Request):
    client = get_client(request)
    response = await client.get(f"{BASE_URL}/users")
    response.raise_for_status()
    return response.json()


@app.get("/pool-stats")
async def pool_stats(request: Request):
    """Show current connection pool info."""
    client = get_client(request)
    limits = client.limits  # httpx.Limits object
    return {
        "info": "Shared AsyncClient — one client reused across ALL requests",
        "max_connections": limits.max_connections,
        "max_keepalive_connections": limits.max_keepalive_connections,
        "keepalive_expiry_seconds": limits.keepalive_expiry,
        "benefit": "No TCP handshake overhead per request; DNS resolved once",
    }


@app.get("/concurrent-users")
async def concurrent_users(request: Request):
    """Demonstrate pool reuse: 10 concurrent calls through one shared client."""
    client = get_client(request)
    responses = await asyncio.gather(
        *[client.get(f"{BASE_URL}/users/{uid}") for uid in range(1, 11)]
    )
    return [r.json() for r in responses]


# KEY POINTS:
# - Lifespan replaces the old @app.on_event("startup") / @app.on_event("shutdown")
# - app.state is a simple namespace for storing app-wide shared objects
# - NEVER call aclose() inside an endpoint — the client must stay open between requests
# - For FastAPI Dependency Injection style: wrap get_client() as a Depends()
