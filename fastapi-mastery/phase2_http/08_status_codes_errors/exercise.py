# =============================================================================
# EXERCISE 08: Status Codes & Error Handling
# =============================================================================
# GOAL: Return correct HTTP status codes and handle errors gracefully.
#
# CONCEPTS:
#   - status_code= on decorators
#   - fastapi.status constants (HTTP_200_OK, HTTP_201_CREATED, etc.)
#   - HTTPException(status_code, detail)
#   - Custom exception handlers with @app.exception_handler
#   - JSONResponse for custom responses
#
# COMMON STATUS CODES:
#   200 OK           - default GET/PUT/PATCH success
#   201 Created      - POST success
#   204 No Content   - DELETE success (no body)
#   400 Bad Request  - invalid input
#   401 Unauthorized - not authenticated
#   403 Forbidden    - not authorized
#   404 Not Found    - resource missing
#   422 Unprocessable- validation error (FastAPI does this automatically)
#   500 Server Error - unexpected failure
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

items_db: dict[int, dict] = {
    1: {"id": 1, "name": "Widget"},
    2: {"id": 2, "name": "Gadget"},
}


# --- Custom Exception class ---
class ItemNotFoundError(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id


# TODO 1: Register a custom exception handler for ItemNotFoundError
#   - It should return a JSONResponse with status 404
#   - Body: {"error": "Item {item_id} was not found in our catalog"}
#   Hint:
#     @app.exception_handler(ItemNotFoundError)
#     async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
#         return JSONResponse(status_code=404, content={...})

@app.exception_handler(ItemNotFoundError)
async def item_not_fount_handler(request: Request, exc: ItemNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "error": f"Item {exc.item_id} was not found in our catalog"
        },
    )


# TODO 2: GET "/items/{item_id}"
#   - If not in db, raise ItemNotFoundError(item_id)  <- uses custom handler
#   - Otherwise return the item with status 200

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in items_db:
        raise ItemNotFoundError(item_id)
    return items_db[item_id]

# TODO 3: POST "/items" with status_code=201 (HTTP_201_CREATED)
class ItemCreate(BaseModel):
    name: str

#   - Accept ItemCreate body
#   - Auto-generate id (max existing key + 1)
#   - Store and return with status 201

@app.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    new_id = max(items_db.keys()) + 1
    new_item = {"id": new_id, "name": item.name}
    items_db[new_id] = new_item
    return new_item

# TODO 4: DELETE "/items/{item_id}" with status_code=204
#   - If not found, raise HTTPException(404)
#   - Delete from db
#   - Return None (204 No Content means no body)

@app.delete("/iems/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(
            status_code=404,
            detail = "Item not found"
        )
    del items_db[item_id]
    return None


# TODO 5: GET "/secret"
#   - Raise HTTPException with status_code=401
#   - detail="Not authenticated"
#   - headers={"WWW-Authenticate": "Bearer"}
#   Hint: raise HTTPException(status_code=401, detail="...", headers={...})

@app.get("/secrept")
def get_secret():
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate":"Bearer"}
    )
