# =============================================================================
# SOLUTION 15: Async Endpoints & APIRouter
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   Swagger: http://127.0.0.1:8000/docs
# =============================================================================

import asyncio
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Async + Router Demo")


# =============================================================================
# PART 1: Async endpoints
# =============================================================================

@app.get("/slow")
async def slow_endpoint():
    await asyncio.sleep(1)   # non-blocking — other requests run during this wait
    return {"message": "This was slow but non-blocking!"}


@app.get("/fast")
async def fast_endpoint():
    return {"message": "This is instant!"}


# =============================================================================
# PART 2: APIRouter
# =============================================================================

# --- Users Router ---
users_router = APIRouter(prefix="/users", tags=["Users"])


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


# --- Items Router ---
items_router = APIRouter(prefix="/items", tags=["Items"])


class ItemCreate(BaseModel):
    name: str
    price: float


@items_router.get("")
async def list_items():
    return [{"id": 1, "name": "Widget"}, {"id": 2, "name": "Gadget"}]


@items_router.post("")
async def create_item(item: ItemCreate):
    return {"id": 3, "name": item.name, "price": item.price}


# --- Register routers ---
app.include_router(users_router)
app.include_router(items_router)
