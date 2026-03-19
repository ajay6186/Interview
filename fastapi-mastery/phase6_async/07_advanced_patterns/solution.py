# =============================================================================
# SOLUTION 07: Advanced Async Patterns  [LEVEL: Senior+ 6-7 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import asyncio
import time
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks, Request, HTTPException
from fastapi.responses import StreamingResponse

BASE_URL = "https://jsonplaceholder.typicode.com"


# ─── Circuit Breaker ──────────────────────────────────────────────────────────

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.state = "CLOSED"
        self.opened_at: float = 0.0

    def record_success(self):
        self.failures = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.state = "OPEN"
            self.opened_at = time.monotonic()

    def allow_request(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if time.monotonic() - self.opened_at >= self.recovery_timeout:
                self.state = "HALF_OPEN"
                return True
            return False
        return True  # HALF_OPEN: allow probe


# ─── App setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )
    app.state.semaphore = asyncio.Semaphore(10)
    app.state.circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="Advanced Async Patterns", lifespan=lifespan)


# ─── Dependencies ─────────────────────────────────────────────────────────────

async def get_http_client(request: Request) -> httpx.AsyncClient:
    """Dependency: inject the shared HTTP client."""
    return request.app.state.http_client


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/limited-fetch/{user_id}")
async def limited_fetch(user_id: int, request: Request,
                         client: httpx.AsyncClient = Depends(get_http_client)):
    """
    Semaphore limits concurrent outbound calls.
    Even if 1000 requests hit this endpoint, at most 10 upstream calls happen at once.
    The rest wait in queue — they don't get rejected, just throttled.
    """
    semaphore: asyncio.Semaphore = request.app.state.semaphore

    async with semaphore:
        response = await client.get(f"{BASE_URL}/users/{user_id}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        response.raise_for_status()
        return response.json()


@app.get("/circuit/{user_id}")
async def circuit_fetch(user_id: int, request: Request,
                         client: httpx.AsyncClient = Depends(get_http_client)):
    """
    Circuit breaker protects the upstream service.
    After 3 failures, the circuit OPENS and rejects requests for 30 seconds.
    """
    circuit: CircuitBreaker = request.app.state.circuit

    if not circuit.allow_request():
        raise HTTPException(
            status_code=503,
            detail=f"Circuit is OPEN — upstream is unhealthy, try again later",
            headers={"Retry-After": "30"},
        )

    try:
        response = await client.get(f"{BASE_URL}/users/{user_id}")
        response.raise_for_status()
        circuit.record_success()
        return {**response.json(), "circuit_state": circuit.state}

    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        circuit.record_failure()
        raise HTTPException(
            status_code=502,
            detail=f"Upstream error: {str(e)}, circuit failures: {circuit.failures}"
        )


@app.get("/circuit-status")
async def circuit_status(request: Request):
    c: CircuitBreaker = request.app.state.circuit
    return {
        "state": c.state,
        "failures": c.failures,
        "threshold": c.failure_threshold,
        "recovery_timeout_seconds": c.recovery_timeout,
    }


# ─── Background Tasks ─────────────────────────────────────────────────────────

async def _fetch_and_log_user(user_id: int, client: httpx.AsyncClient):
    """This runs AFTER the response is already sent to the client."""
    try:
        resp = await client.get(f"{BASE_URL}/users/{user_id}")
        user = resp.json()
        print(f"[BG] Fetched user: {user.get('name')} (id={user_id})")
    except Exception as e:
        print(f"[BG] Failed to fetch user {user_id}: {e}")


@app.post("/notify/{user_id}")
async def notify_user(user_id: int, background_tasks: BackgroundTasks,
                       client: httpx.AsyncClient = Depends(get_http_client)):
    """
    Returns immediately. Slow work (fetching user, sending email, etc.)
    happens in the background AFTER the response is delivered.
    """
    background_tasks.add_task(_fetch_and_log_user, user_id, client)
    return {
        "status": "accepted",
        "message": f"Processing user {user_id} in background",
    }


# ─── Streaming Response ───────────────────────────────────────────────────────

@app.get("/stream-posts")
async def stream_posts(client: httpx.AsyncClient = Depends(get_http_client)):
    """
    Stream 10 posts one-by-one as newline-delimited JSON (NDJSON).
    The client receives data progressively — useful for large datasets.
    """
    async def generate():
        for post_id in range(1, 11):
            resp = await client.get(f"{BASE_URL}/posts/{post_id}")
            yield resp.text + "\n"
            await asyncio.sleep(0.2)  # Simulate chunked production

    return StreamingResponse(generate(), media_type="application/x-ndjson")


# KEY POINTS:
# - Semaphore = concurrency cap without rejecting requests (they queue up)
# - Circuit Breaker = fail-fast mechanism to avoid cascading failures
# - BackgroundTasks = respond fast, do slow I/O work after sending response
# - StreamingResponse = memory-efficient for large or real-time data
# - Depends() = clean dependency injection; works with async functions
#
# FURTHER READING / PRODUCTION UPGRADES:
# - Use `tenacity` library for production-grade retry with jitter
# - Use `asyncio.TaskGroup` (Python 3.11+) for structured concurrency
# - Use `aiocache` for async caching layer (Redis/memcache)
# - Use `opentelemetry` for distributed tracing across async calls
