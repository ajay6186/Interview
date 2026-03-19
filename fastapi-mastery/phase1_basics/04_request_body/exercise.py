# =============================================================================
# EXERCISE 04: Request Body with Pydantic
# =============================================================================
# GOAL: Accept JSON data in the request body using Pydantic models.
#
# CONCEPTS:
#   - BaseModel for defining request body schema
#   - FastAPI reads JSON body automatically
#   - Pydantic validates types and raises 422 if invalid
#   - Optional fields with None default
#   - Combining body + path + query params
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Use Swagger UI at http://127.0.0.1:8000/docs to test POST requests
#
# =============================================================================

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


# TODO 1: Create a Pydantic model called "Item" with these fields:
#   - name: str           (required)
#   - description: str    (optional, default None)
#   - price: float        (required)
#   - tax: float          (optional, default None)

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None


# TODO 2: Create a POST endpoint at "/items"
#   - Accept an Item in the request body
#   - Return the item as-is
#   Test JSON: {"name": "Laptop", "price": 999.99}

@app.get("/items")
def get_items(items: Item):
    return items

# TODO 3: Create a POST endpoint at "/items/{item_id}"
#   - Path param: item_id (int)
#   - Query param: q (Optional[str], default None)
#   - Body: Item
#   - Build a result dict starting with the item fields (use item.model_dump())
#   - Always add "item_id" to the result
#   - If q is provided, add "q" to the result
#   - If item.tax is not None, add "price_with_tax": item.price + item.tax
#   - Return the result dict

# --- Body + path param + query param ---
@app.post("/items/{item_id}")
def create_item_with_id(item_id: int, item: Item, q: Optional[str] = None):
    result = {"item_id": item_id, **item.model_dump()}
    if q:
        result["q"] = q
    if item.tax is not None:
        result["price_with_tax"] = item.price + item.tax
    return result

# TODO 4: Create a Pydantic model called "User" with:
#   - username: str
#   - full_name: Optional[str] = None

class User(BaseModel):
    username: str
    full_name: Optional[str] = None
#
# Then create a POST endpoint at "/combined"
#   - Accept BOTH an Item body and a User body
#   - Hint: FastAPI handles multiple body params using the param names as keys
#     def create_combined(item: Item, user: User):
#   - Return {"item": item, "user": user}

@app.post("/combined")
def create_combined(item: Item, user: User):
    return {"item": item, "user": user}