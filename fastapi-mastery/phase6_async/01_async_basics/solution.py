# =============================================================================
# SOLUTION 01: Async Basics  [LEVEL: Beginner 0-1 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   Then open: http://127.0.0.1:8000/docs
# =============================================================================

import asyncio
from fastapi import FastAPI

app = FastAPI(title="Async Basics")


# Simple async endpoint — notice `async def` instead of `def`
@app.get("/")
async def read_root():
    return {"message": "Hello from async FastAPI!", "is_async": True}


# Simulating I/O wait (e.g. database call, file read)
# asyncio.sleep() is non-blocking — other requests can be handled during the wait
@app.get("/simulate-io")
async def simulate_io():
    await asyncio.sleep(1)  # Non-blocking 1-second wait
    return {"message": "Done!", "waited_seconds": 1}


# Async endpoint with a path parameter
@app.get("/greet/{name}")
async def greet(name: str):
    await asyncio.sleep(0.1)  # Simulate a small async lookup
    return {"greeting": f"Hello, {name}!", "processed_async": True}


# KEY TAKEAWAYS:
# 1. `async def` turns a function into a coroutine
# 2. `await` is required inside async functions when calling other async functions
# 3. asyncio.sleep(n) is the async version of time.sleep(n) — never use time.sleep in async code!
# 4. FastAPI natively supports both def and async def routes
