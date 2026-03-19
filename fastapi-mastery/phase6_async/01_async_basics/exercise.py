# =============================================================================
# EXERCISE 01: Async Basics  [LEVEL: Beginner 0-1 yr]
# =============================================================================
# GOAL: Understand what async/await means and write your first async endpoints.
#
# THEORY:
#   - Normal (sync) function:  def my_func():  → FastAPI runs it in a thread pool
#   - Async function:          async def my_func(): → FastAPI runs it in the event loop
#   - "await" pauses the current coroutine and lets other tasks run while waiting
#   - Use async when you do I/O: database queries, HTTP calls, file reads, etc.
#
# WHEN TO USE async:
#   ✅ Calling external APIs (httpx, aiohttp)
#   ✅ Database queries (asyncpg, motor, SQLAlchemy async)
#   ✅ Reading/writing files (aiofiles)
#   ❌ CPU heavy work (use multiprocessing instead)
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Then open: http://127.0.0.1:8000/docs
#
# =============================================================================

import asyncio
from fastapi import FastAPI

app = FastAPI(title="Async Basics")


# TODO 1: Create a simple ASYNC GET endpoint at "/"
#   - Use `async def` instead of `def`
#   - Return {"message": "Hello from async FastAPI!", "is_async": True}
#   Hint: @app.get("/")  then  async def read_root():

@app.get("/")
async def test():
    return {"message":"Hello from async FastAPI!", "is_async": True}


# TODO 2: Create an async GET endpoint at "/simulate-io"
#   - Use asyncio.sleep(1) to simulate waiting for I/O (like a DB call)
#   - Return {"message": "Done!", "waited_seconds": 1}
#   Hint: await asyncio.sleep(1)  -- note: you MUST use await here

@app.get("/simulate-io")
async def simulate_io():
    await asyncio.sleep(1)
    return {"message": "Done!", "waited_seconds": 1}


# TODO 3: Create an async GET endpoint at "/greet/{name}"
#   - Accept a path parameter `name: str`
#   - Await asyncio.sleep(0.1)  (simulate a small async operation)
#   - Return {"greeting": f"Hello, {name}!", "processed_async": True}


@app.get("/greet/{name}")
async def greet(name: str):
    await asyncio.sleep(0.1)
    return {"greeting": f"Hello, {name}!", "procesed_async": True}