# =============================================================================
# EXERCISE 07: Advanced Async Patterns  [LEVEL: Senior+ 6-7 yr]
# =============================================================================
# GOAL: Implement production-grade patterns: circuit breaker, rate limiting,
#       async dependency injection, background tasks, and semaphore-based
#       concurrency control.
#
# PATTERNS COVERED:
#
#  1. SEMAPHORE — limit how many concurrent calls happen at once
#       sem = asyncio.Semaphore(10)
#       async with sem:
#           await client.get(url)
#
#  2. CIRCUIT BREAKER — stop hammering a failing service
#       States: CLOSED (normal) → OPEN (failing, reject fast) → HALF-OPEN (test)
#       After N consecutive failures → OPEN (fail fast for X seconds)
#       After cool-down → HALF-OPEN → if success → CLOSED
#
#  3. ASYNC DEPENDENCY INJECTION — inject shared async resources via Depends()
#       async def get_http_client(request: Request) -> httpx.AsyncClient:
#           return request.app.state.http_client
#       async def endpoint(client = Depends(get_http_client)):
#           ...
#
#  4. BACKGROUND TASKS — respond immediately, do slow work after sending response
#       from fastapi import BackgroundTasks
#       def endpoint(background_tasks: BackgroundTasks):
#           background_tasks.add_task(slow_function, arg1, arg2)
#           return {"status": "accepted"}
#
#  5. STREAMING RESPONSES — stream large data without buffering all in memory
#       from fastapi.responses import StreamingResponse
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import asyncio
import time
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks, Request, HTTPException
from fastapi.responses import StreamingResponse

BASE_URL = "https://jsonplaceholder.typicode.com"


# ─── App setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    app.state.semaphore = asyncio.Semaphore(10)   # max 10 concurrent outbound calls
    app.state.circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
    yield
    await app.state.http_client.aclose()

app = FastAPI(title="Advanced Async Patterns", lifespan=lifespan)


# ─── Circuit Breaker ──────────────────────────────────────────────────────────

class CircuitBreaker:
    """
    Simple circuit breaker with three states:
      CLOSED    → requests pass through normally
      OPEN      → requests are rejected immediately (fast-fail)
      HALF_OPEN → one test request allowed; if success → CLOSED, else → OPEN
    """
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.state = "CLOSED"          # "CLOSED" | "OPEN" | "HALF_OPEN"
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
                return True   # allow one probe request
            return False      # fast-fail
        # HALF_OPEN — allow the single probe
        return True


# ─── Dependency: shared HTTP client ───────────────────────────────────────────

# TODO 1: Write an async dependency function `get_http_client`
#   - Accept `request: Request` as parameter
#   - Return request.app.state.http_client
#   This lets endpoints declare:  client: httpx.AsyncClient = Depends(get_http_client)


# ─── Endpoints ────────────────────────────────────────────────────────────────

# TODO 2: Create GET /limited-fetch/{user_id}
#   - Get semaphore from request.app.state.semaphore
#   - Use `async with semaphore:` to cap concurrency to 10
#   - Inside: fetch user from BASE_URL and return JSON
#   This prevents stampeding the upstream API with 1000 concurrent calls.


# TODO 3: Create GET /circuit/{user_id}
#   - Get the CircuitBreaker from request.app.state.circuit
#   - If not circuit.allow_request() → raise HTTPException 503 "Circuit is OPEN"
#   - Try to fetch the user; on success call circuit.record_success()
#   - On httpx.RequestError call circuit.record_failure() then raise HTTPException 502
#   - Return user JSON + {"circuit_state": circuit.state}


# TODO 4: Create POST /notify/{user_id}
#   - Accept background_tasks: BackgroundTasks
#   - Return {"status": "accepted", "message": "Processing in background"} IMMEDIATELY
#   - Add a background task that:
#       1. Fetches the user from JSONPlaceholder
#       2. Prints f"[BG] Fetched user: {user['name']}"
#     Use background_tasks.add_task(some_function, arg1, arg2)
#   Note: background functions can be async def or regular def


# TODO 5: Create GET /stream-posts
#   - Use StreamingResponse to stream 10 posts one-by-one
#   - Generator function:
#       async def generate():
#           for post_id in range(1, 11):
#               resp = await client.get(f"{BASE_URL}/posts/{post_id}")
#               yield resp.text + "\n"
#               await asyncio.sleep(0.2)   # simulate delay between chunks
#   - Return StreamingResponse(generate(), media_type="application/x-ndjson")
