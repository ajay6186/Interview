# =============================================================================
# SOLUTION 07: Response Models
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserPublic(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None


class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str
    full_name: Optional[str] = None


users_db: dict[str, UserInDB] = {}


# --- Register user (hide password in response) ---
@app.post("/users", response_model=UserPublic)
def register_user(user: UserCreate):
    db_user = UserInDB(
        username=user.username,
        email=user.email,
        hashed_password="hashed_" + user.password,
        full_name=user.full_name,
    )
    users_db[user.username] = db_user
    return db_user  # Pydantic filters to UserPublic fields only


# --- List users ---
@app.get("/users", response_model=List[UserPublic])
def list_users():
    return list(users_db.values())


# --- Get one user ---
@app.get("/users/{username}", response_model=UserPublic)
def get_user(username: str):
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[username]


# --- Partial response with exclude_unset ---
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None
    tags: List[str] = []


@app.post("/items", response_model=Item, response_model_exclude_unset=True)
def create_item(item: Item):
    return item
