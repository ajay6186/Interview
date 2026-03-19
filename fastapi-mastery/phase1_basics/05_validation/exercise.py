# =============================================================================
# EXERCISE 05: Query & Path Validation with Field Constraints
# =============================================================================
# GOAL: Add constraints to path and query params using Query() and Path().
#
# CONCEPTS:
#   - Query(...) and Path(...) from fastapi
#   - min_length, max_length for strings
#   - ge (>=), le (<=), gt (>), lt (<) for numbers
#   - regex / pattern for string format
#   - ... (Ellipsis) means "required"
#   - alias for renaming query params
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Test: http://127.0.0.1:8000/docs
#
# =============================================================================

from fastapi import FastAPI, Query, Path
from typing import Optional, List

app = FastAPI()

fake_db = {i: {"name": f"Item {i}", "price": i * 10.0} for i in range(1, 21)}


# TODO 1: Create GET "/items/{item_id}"
#   - item_id: int, must be >= 1 (use Path with ge=1)
#   - Return the item from fake_db, or {"error": "not found"} if missing
#   Hint: Path(..., ge=1)  <- ... means 

# @app.get("/items/{item_id}")
# def get_items(item_id: int = Path(..., ge = 1)):
#     item = fake_db.get(item_id)
#     if item is None:
#         return {"error": "not found"}
#     return item


# TODO 2: Create GET "/search"
#   - q: Optional[str]
#       min_length=2, max_length=50
#       If None, default to None
#   - Return {"results": [item for item in fake_db.values() if q in item["name"]]}
#     (or all items if q is None)
#   Hint: q: Optional[str] = Query(default=None, min_length=2, max_length=50)

@app.get("/search")
def get_search(q: Optional[str] = Query(default=None, min_length=2, max_length=50)):
    if q is None:
        return {"results": list(fake_db.values())}
    return {"results": [item for item in fake_db.values() if q in item["name"]]}


# TODO 3: Create GET "/items" (multi-value query param)
#   - ids: list of ints (Query param that can appear multiple times)
#   - Return only items from fake_db whose keys are in ids
#   Hint: ids: List[int] = Query(default=[])
#   Test URL: /items?ids=1&ids=3&ids=5

@app.get("/items")
def get_items_by_ids(ids: List[int] = Query(default=[])):
    return {id_: fake_db[id_] for id_ in ids if id_ in fake_db}

# TODO 4: Create GET "/products/{product_id}"
#   - product_id: int, ge=1, le=20
#   - price_min: float, ge=0.0, default=0.0
#   - price_max: float, le=1000.0, default=1000.0
#   - Return items from fake_db[product_id] only if price is in [price_min, price_max]
#   - Otherwise return {"message": "Price out of filter range"}

@app.get("/products/{product_id}")
def get_products(
        product_id: int = Path(..., ge=1, le=20),
        price_min: float = Query(default=0.0, ge=0.0),
        price_max: float = Query(default=1000.0, le=1000.0),
):
    item = fake_db[product_id]
    if price_min <= item["price"] <= price_max:
        return item
    return {"message": "Price out of filter range"}

    