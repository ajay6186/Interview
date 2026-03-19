# =============================================================================
# SOLUTION 05: Query & Path Validation
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI, Query, Path
from typing import Optional, List

app = FastAPI()

fake_db = {i: {"name": f"Item {i}", "price": i * 10.0} for i in range(1, 21)}


# --- Path constraint: ge=1 ---
@app.get("/items/{item_id}")
def get_item(item_id: int = Path(..., ge=1)):
    item = fake_db.get(item_id)
    if item is None:
        return {"error": "not found"}
    return item


# --- Query string constraints ---
@app.get("/search")
def search(q: Optional[str] = Query(default=None, min_length=2, max_length=50)):
    if q is None:
        return {"results": list(fake_db.values())}
    return {"results": [item for item in fake_db.values() if q in item["name"]]}


# --- Multi-value query param ---
@app.get("/items")
def get_items_by_ids(ids: List[int] = Query(default=[])):
    return {id_: fake_db[id_] for id_ in ids if id_ in fake_db}


# --- Path + query range filter ---
@app.get("/products/{product_id}")
def get_product(
    product_id: int = Path(..., ge=1, le=20),
    price_min: float = Query(default=0.0, ge=0.0),
    price_max: float = Query(default=1000.0, le=1000.0),
):
    item = fake_db[product_id]
    if price_min <= item["price"] <= price_max:
        return item
    return {"message": "Price out of filter range"}
