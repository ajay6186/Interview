# =============================================================================
# SOLUTION 03: Query Parameters
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI
from typing import Optional

app = FastAPI()

fake_items = [
    {"name": "Laptop", "price": 999.99},
    {"name": "Phone", "price": 499.99},
    {"name": "Tablet", "price": 299.99},
    {"name": "Monitor", "price": 199.99},
    {"name": "Keyboard", "price": 49.99},
]


# --- Pagination with skip/limit ---
@app.get("/items")
def list_items(skip: int = 0, limit: int = 10):
    return fake_items[skip: skip + limit]


# --- Required query param + optional ---
@app.get("/search")
def search_items(q: str, limit: int = 5):
    results = [item for item in fake_items if q.lower() in item["name"].lower()]
    return {"query": q, "results": results[:limit]}


# --- Mixed path + query params + bool ---
@app.get("/products/{product_id}")
def get_product(product_id: int, include_tax: bool = False):
    item = dict(fake_items[product_id])   # copy to avoid mutation
    if include_tax:
        item["price_with_tax"] = round(item["price"] * 1.1, 2)
    return item
