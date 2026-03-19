# =============================================================================
# EXERCISE 11: Dependency Injection Basics
# =============================================================================
# GOAL: Learn FastAPI's powerful dependency injection system.
#
# CONCEPTS:
#   - Depends() to inject reusable logic
#   - Dependencies as functions (sync or async)
#   - Sharing pagination logic across endpoints
#   - Nested dependencies (dependency that uses another dependency)
#   - Class-based dependencies
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI, Depends, HTTPException, Query
from typing import Optional

app = FastAPI()

fake_items = [{"name": f"Item {i}", "value": i * 10} for i in range(1, 51)]
fake_users = {"alice": {"username": "alice", "role": "admin"},
              "bob":   {"username": "bob",   "role": "user"}}


# TODO 1: Create a "pagination" dependency function
#   - Params: skip: int = 0, limit: int = Query(default=10, le=100)
#   - Return {"skip": skip, "limit": limit}
#   Hint:
#     def pagination(skip: int = 0, limit: int = Query(default=10, le=100)):
#         return {"skip": skip, "limit": limit}

def pagination(skip: int = 0, limit: int = Query(default=10, le=100)):
    return {"skip": skip, "limit": limit}

# TODO 2: Create GET "/items" that uses the pagination dependency
#   - Inject it with: commons: dict = Depends(pagination)
#   - Return fake_items[commons["skip"] : commons["skip"] + commons["limit"]]
@app.get("/items")
def list_items(commons: dict = Depends(pagination)):
    return fake_items[commons["skip"]: commons["skip"]+commons["limit"]]

# TODO 3: Create GET "/users" that also uses the pagination dependency
#   - Same approach, return list(fake_users.values()) sliced by pagination

@app.get("/users")
def list_users(commons: dict = Depends(pagination)):
    all_users = list(fake_users.values())
    return all_users[commons["skip"]: commons["skip"] + commons["limit"]]
    

# TODO 4: Create a class-based dependency called "ItemFilter"
#   - __init__(self, min_value: int = 0, max_value: int = 100)
#   - __call__(self) returns a filter function or use it directly
#   - Actually, just store min_value and max_value as instance attrs
#
#   Then use it in GET "/items/filtered":
#     def get_filtered(filter: ItemFilter = Depends(ItemFilter)):
#         return [i for i in fake_items if filter.min_value <= i["value"] <= filter.max_value]
#   Test: /items/filtered?min_value=20&max_value=50

class ItemFilter:
    def __init__(self, min_value: int=0, max_value: int = 100):
        self.min_value = min_value
        self.max_value = max_value

@app.get("/items/filtered")
def get_filtered(filter: ItemFilter = Depends(ItemFilter)):
    return [i for i in fake_items if filter.min_value <= i["value"] <= filter.max_value]



# TODO 5: Create a "get_current_user" dependency:
#   - Accept: username: str = Query(...)
#   - Look up in fake_users, raise 401 if not found
#   - Return the user dict
#
#   Create GET "/profile" that uses get_current_user:
#     - Return {"profile": user, "message": f"Welcome, {user['username']}!"}
#   Test: /profile?username=alice

def get_current_user(username: str = Query(...)):
    user = fake_users.get(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    return {"profile": user, "message": f"Welcome, {user['username']}!"}
