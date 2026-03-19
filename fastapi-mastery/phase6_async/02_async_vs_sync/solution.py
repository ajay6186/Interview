# =============================================================================
# SOLUTION 02: Async vs Sync  [LEVEL: Beginner 1-2 yr]
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

import asyncio
import time
from fastapi import FastAPI

app = FastAPI(title="Async vs Sync")


# SYNC: Blocks the thread for 1 second per request
# With 5 concurrent requests → ~5 seconds total (sequential)
@app.get("/sync-slow")
def sync_slow():
    time.sleep(1)  # BLOCKS — thread cannot serve other requests
    return {"endpoint": "sync-slow", "slept": 1}


# ASYNC: Yields control while waiting
# With 5 concurrent requests → ~1 second total (concurrent)
@app.get("/async-slow")
async def async_slow():
    await asyncio.sleep(1)  # NON-BLOCKING — event loop serves other requests
    return {"endpoint": "async-slow", "slept": 1}


@app.get("/info")
async def info():
    return {
        "use_sync_when": "doing CPU-heavy work (math, image processing)",
        "use_async_when": "doing I/O work (API calls, DB queries, file reads)",
        "common_mistake": "using time.sleep() in async functions",
        "rule_of_thumb": "If you await something, use async def. Otherwise def is fine.",
    }


# IMPORTANT RULES:
# ❌ NEVER do this:
#    async def bad():
#        time.sleep(1)   # Blocks the entire event loop! All requests freeze.
#
# ✅ ALWAYS do this:
#    async def good():
#        await asyncio.sleep(1)   # Only this coroutine pauses, others run fine.
