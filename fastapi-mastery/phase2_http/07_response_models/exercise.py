# =============================================================================
# EXERCISE 07: Response Models
# =============================================================================
# GOAL: Control what data FastAPI returns using response_model.
#
# CONCEPTS:
#   - response_model= parameter on decorators
#   - Hiding sensitive fields (e.g. password) from response
#   - response_model_exclude_unset=True  -> skip fields not set
#   - response_model_include / response_model_exclude
#   - List[Model] as response model
#   - Union response models
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Use: http://127.0.0.1:8000/docs
#
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List

app = FastAPI()


# --- Models ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str          # sensitive — should NOT appear in response
    full_name: Optional[str] = None

class UserPublic(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    # Note: no password field here!


class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str   # internal, never expose
    full_name: Optional[str] = None


# In-memory storage
users_db: dict[str, UserInDB] = {}


# TODO 1: POST "/users" - register a new user
#   - Accept UserCreate body
#   - Store a UserInDB (fake hashing: hashed_password = "hashed_" + password)
#   - Use response_model=UserPublic so the password is NEVER returned
#   Test: POST with {"username":"alice","email":"a@b.com","password":"secret"}
#         Response should NOT include "password"

@app.post("/users", response_model=UserPublic)
def create_user(user: UserCreate):
    db_user = UserInDB(
        username=user.username,
        email=user.email,
        hashed_password="hashed_" + user.password,
        full_name= user.full_name,
    )
    users_db[user.username] = db_user
    return db_user
    
# TODO 2: GET "/users" - list all users
#   - response_model=List[UserPublic]
#   - Return all users (convert UserInDB -> UserPublic by excluding hashed_password)
#   Hint: return list(users_db.values())  -- Pydantic handles the filtering

@app.get("/users", response_model=List[UserPublic])
def list_users():
    return list(users_db.values())

# TODO 3: GET "/users/{username}"
#   - response_model=UserPublic
#   - Return 404 if not found
@app.get("/users/{username}", response_model= UserPublic)
def get_user(username: str):
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[username]


# --- Partial response demo ---
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None
    tags: List[str] = []


# TODO 4: POST "/items" with response_model=Item, response_model_exclude_unset=True
#   - Accept an Item body and return it
#   - Because of exclude_unset=True, fields not provided won't appear in response
#   Test: POST {"name": "Widget", "price": 9.99}
#         Response should only show name and price (not description, tax, tags)

@app.post("/items", response_model= Item, response_model_exclude_unset=True)
def create_item(item: Item):
    return item
