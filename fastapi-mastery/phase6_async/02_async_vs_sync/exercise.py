# =============================================================================
# EXERCISE 02: Async vs Sync — See the Difference  [LEVEL: Beginner 1-2 yr]
# =============================================================================
# GOAL: Understand WHY async matters by comparing sync vs async performance.
#
# THEORY:
#   Sync endpoint:  FastAPI runs it in a threadpool (default 40 threads).
#                   Each request BLOCKS a thread while waiting.
#   Async endpoint: FastAPI runs it in the event loop.
#                   While one request awaits, others can be served. No thread wasted.
#
#   Analogy:
#     Sync  = One cashier, queue freezes when they wait for a price check
#     Async = One cashier who keeps helping others while waiting for the price check
#
# HOW TO TEST DIFFERENCE:
#   Start the server, then in another terminal run:
#     python -c "
#     import httpx, asyncio, time
#     async def test():
#         async with httpx.AsyncClient() as c:
#             start = time.time()
#             tasks = [c.get('http://localhost:8000/sync-slow') for _ in range(5)]
#             await asyncio.gather(*tasks)
#             print('sync:', time.time()-start)
#             start = time.time()
#             tasks = [c.get('http://localhost:8000/async-slow') for _ in range(5)]
#             await asyncio.gather(*tasks)
#             print('async:', time.time()-start)
#     asyncio.run(test())
#     "
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
# =============================================================================

import asyncio
import time
from fastapi import FastAPI

app = FastAPI(title="Async vs Sync")


# TODO 1: Create a SYNC endpoint at "/sync-slow"
#   - Use `def` (NOT async def)
#   - Call time.sleep(1) to simulate blocking I/O
#   - Return {"endpoint": "sync-slow", "slept": 1}
#   Note: time.sleep BLOCKS the thread — other requests must wait

@app.get("/sync-slow")
def sync_slow():
    time.sleep(1)
    return {"endpoint": "sync-slow", "slept":1}


# TODO 2: Create an ASYNC endpoint at "/async-slow"
#   - Use `async def`
#   - Call await asyncio.sleep(1) to simulate non-blocking I/O
#   - Return {"endpoint": "async-slow", "slept": 1}
#   Note: asyncio.sleep releases control — other requests can run concurrently

@app.get("async-slow")
async def async_slow():
    await asyncio.sleep(1)
    return {"endpoint":"async-slow", "slept": 1}



# TODO 3: Create an async endpoint at "/info"
#   - Return a dict explaining when to use sync vs async:
#   {
#     "use_sync_when": "doing CPU-heavy work (math, image processing)",
#     "use_async_when": "doing I/O work (API calls, DB queries, file reads)",
#     "common_mistake": "using time.sleep() in async functions"
#   }
