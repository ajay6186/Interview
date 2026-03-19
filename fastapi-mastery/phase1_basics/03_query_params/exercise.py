# =============================================================================
# EXERCISE 03: Query Parameters
# =============================================================================
# GOAL: Capture optional/required values from the URL query string.
#
# CONCEPTS:
#   - Query params = function params NOT in the path
#   - Optional params with default values
#   - Required params (no default)
#   - bool query params ("true"/"false"/"1"/"0" auto-converted)
#   - Optional[type] with None default
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Test URLs:
#     http://127.0.0.1:8000/items?skip=0&limit=10
#     http://127.0.0.1:8000/items?skip=5
#     http://127.0.0.1:8000/search?q=python&limit=5
#     http://127.0.0.1:8000/products/42?include_tax=true
#
# =============================================================================

from fastapi import FastAPI
from typing import Optional

app = FastAPI()

# Fake product database
fake_items = [
    {"name": "Laptop", "price": 999.99},
    {"name": "Phone", "price": 499.99},
    {"name": "Tablet", "price": 299.99},
    {"name": "Monitor", "price": 199.99},
    {"name": "Keyboard", "price": 49.99},
]


# TODO 1: Create a GET endpoint at "/items"
#   - Accept query params: skip (int, default 0) and limit (int, default 10)
#   - Return the slice of fake_items: fake_items[skip : skip + limit]
#   Test: /items?skip=0&limit=2  -> first 2 items
#   Test: /items?skip=2&limit=2  -> next 2 items

@app.get("/items")
def get_items(skip: int=0 ,limit: int=10):
    return {"fake_items": fake_items[skip: skip+limit]}


# TODO 2: Create a GET endpoint at "/search"
#   - Accept query params:
#       q: str (required — no default)
#       limit: int (optional, default 5)
#   - Filter fake_items where q appears (case-insensitive) in the item's "name"
#   - Return {"query": q, "results": filtered_list}
@app.get("/search")
def get_search(q: str, limit: int = 5):
    data = [i for i in fake_items if q.lower() in i["name"].lower()]
    return {"query" : q, "result": data[:limit]}

# TODO 3: Create a GET endpoint at "/products/{product_id}"
#   - Path param: product_id (int)
#   - Query param: include_tax (bool, default False)
#   - Get the item at fake_items[product_id] (don't worry about index error)
#   - If include_tax is True, add a "price_with_tax" key = price * 1.1 (rounded to 2 decimals)
#   - Return the item dict (copy it first so you don't mutate fake_items)

# --- Mixed path + query params + bool ---
@app.get("/products/{product_id}")
def get_product(product_id: int, include_tax: bool = False):
    item = dict(fake_items[product_id])   # copy to avoid mutation
    if include_tax:
        item["price_with_tax"] = round(item["price"] * 1.1, 2)
    return item
