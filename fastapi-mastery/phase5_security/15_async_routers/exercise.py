# =============================================================================
# EXERCISE 15: Async Endpoints & APIRouter
# =============================================================================
# GOAL: Use async/await for non-blocking IO and organize routes with APIRouter.
#
# CONCEPTS:
#   - async def vs def endpoints
#   - await for async operations (DB calls, HTTP calls, file IO)
#   - APIRouter for splitting routes into separate files/modules
#   - Router prefix and tags
#   - Including routers into the main app
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

import asyncio
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Async + Router Demo")


# =============================================================================
# PART 1: Async endpoints
# =============================================================================

# TODO 1: Create an async GET "/slow"
#   - await asyncio.sleep(1) to simulate async IO
#   - Return {"message": "This was slow but non-blocking!"}
#   - Notice: the server handles other requests while waiting

@app.get("/slow")
async def slow_endpoint():
    await asyncio.sleep(100)
    return {"message": "This was slow but non-blocking!"}


# TODO 2: Create an async GET "/fast"
#   - Return {"message": "This is instant!"} with NO await
#   - Both /slow and /fast can be called concurrently

@app.get("/fast")
async def fast_endpoint():
    return {"message": "This is instant!"}

# =============================================================================
# PART 2: APIRouter
# =============================================================================

# TODO 3: Create a "users_router" APIRouter with prefix="/users" and tags=["Users"]
#   users_router = APIRouter(prefix="/users", tags=["Users"])
#
#   Add these routes to users_router (NOT to app directly):
#
#   GET  /users        -> return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
#   GET  /users/{id}   -> return {"id": id, "name": "Alice" if id==1 else "Bob"}
#   POST /users        -> accept {"name": str} body, return {"id": 3, "name": name}

users_router = APIRouter(prefix="/users", tags=['Users'])

class UserCreate(BaseModel):
    name: str

@users_router.get("")
async def list_users():
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]


@users_router.get("/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": "Alice" if user_id == 1 else "Bob"}

@users_router.post("")
async def create_user(user: UserCreate):
    return {"id": 3, "name": user.name}

# TODO 4: Create an "items_router" APIRouter with prefix="/items" and tags=["Items"]
#
#   Add these routes:
#   GET  /items        -> return [{"id": 1, "name": "Widget"}, {"id": 2, "name": "Gadget"}]
#   POST /items        -> accept {"name": str, "price": float}, return it with id=3


# TODO 5: Include both routers in the main app:
app.include_router(users_router)
# app.include_router(items_router)   # uncomment after completing TODO 4

# After including, check http://127.0.0.1:8000/docs
# You'll see routes organized by tags!
