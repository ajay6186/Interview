# =============================================================================
# SOLUTION 08: Status Codes & Error Handling
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

items_db: dict[int, dict] = {
    1: {"id": 1, "name": "Widget"},
    2: {"id": 2, "name": "Gadget"},
}


# --- Custom exception ---
class ItemNotFoundError(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id


# --- Register handler ---
@app.exception_handler(ItemNotFoundError)
async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": f"Item {exc.item_id} was not found in our catalog"},
    )


# --- GET with custom exception ---
@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in items_db:
        raise ItemNotFoundError(item_id)
    return items_db[item_id]


# --- POST with 201 ---
class ItemCreate(BaseModel):
    name: str


@app.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    new_id = max(items_db.keys()) + 1
    new_item = {"id": new_id, "name": item.name}
    items_db[new_id] = new_item
    return new_item


# --- DELETE with 204 ---
@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    del items_db[item_id]
    return None   # No body for 204


# --- 401 with WWW-Authenticate header ---
@app.get("/secret")
def get_secret():
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
