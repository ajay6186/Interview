# =============================================================================
# SOLUTION 04: Request Body with Pydantic
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   Use: http://127.0.0.1:8000/docs
# =============================================================================

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


# --- Pydantic models ---
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None


class User(BaseModel):
    username: str
    full_name: Optional[str] = None


# --- Simple POST with body ---
@app.post("/items")
def create_item(item: Item):
    return item


# --- Body + path param + query param ---
@app.post("/items/{item_id}")
def create_item_with_id(item_id: int, item: Item, q: Optional[str] = None):
    result = {"item_id": item_id, **item.model_dump()}
    if q:
        result["q"] = q
    if item.tax is not None:
        result["price_with_tax"] = item.price + item.tax
    return result


# --- Multiple body params ---
@app.post("/combined")
def create_combined(item: Item, user: User):
    # FastAPI wraps them: {"item": {...}, "user": {...}}
    return {"item": item, "user": user}
