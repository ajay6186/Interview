# =============================================================================
# EXERCISE 09: Pydantic Models Deep Dive
# =============================================================================
# GOAL: Master Pydantic v2 for data validation and serialization.
#
# CONCEPTS:
#   - Field() with constraints
#   - @field_validator and @model_validator
#   - model_dump() / model_dump(exclude_none=True)
#   - model_config (previously class Config)
#   - Computed fields
#   - Custom types
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator, computed_field
from typing import Optional
from datetime import datetime

app = FastAPI()


# TODO 1: Create a "UserRegister" Pydantic model with:
#   - username: str  (min_length=3, max_length=20)
#   - email: str     (must contain "@", validate with @field_validator)
#   - password: str  (min_length=8)
#   - confirm_password: str
#   - age: Optional[int] = None  (if provided, must be >= 18)
#
#   Add a @model_validator(mode="after") to check:
#     - password == confirm_password  (raise ValueError if they don't match)
#
#   Hint:
#     @field_validator("email")
#     @classmethod
#     def validate_email(cls, v: str) -> str:
#         if "@" not in v:
#             raise ValueError("Invalid email address")
#         return v.lower()   # normalize to lowercase
#
#     @model_validator(mode="after")
#     def passwords_match(self):
#         if self.password != self.confirm_password:
#             raise ValueError("Passwords do not match")
#         return self

class UserRegister(BaseModel):
    username: str =Field(..., min_length=3, max_length=20)
    email: str
    password: str = Field(..., min_length=8)
    confirm_password: str
    age: Optional[int] = Field(default=None, ge=18)
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v:
            raise ValueError("Invalid email address")
        return v.lower()

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
            
# TODO 2: Create a "Product" model with:
#   - name: str
#   - price: float  (gt=0)
#   - discount: float = 0.0  (ge=0, lt=1)  <- percentage 0.0 to 0.99
#   - @computed_field: final_price -> price * (1 - discount), round 2 decimals
#
#   Hint:
#     @computed_field
#     @property
#     def final_price(self) -> float:
#         return round(self.price * (1 - self.discount), 2)

class Product(BaseModel):
    name: str
    price: float = Field(..., gt=0)
    discount: float = Field(default=0.0, ge=0.0, lt=1.0)
    
    @computed_field
    @property
    def final_price(self) -> float:
        return round(self.price * (1 - self.discount), 2)

# TODO 3: Create POST "/register" accepting UserRegister
#   - Return {"message": "User registered", "username": ..., "email": ...}
#   - If validation fails, FastAPI automatically returns 422

@app.post("/register")
def register(user: UserRegister):
    return {"message": "User registered", "username": user.username, "email": user.email}

# TODO 4: Create POST "/products" accepting Product
#   - Return the product (it will include computed final_price automatically)
#   Test: {"name": "Laptop", "price": 1000.0, "discount": 0.2}
#         Response should include "final_price": 800.0

@app.post("/products")
def create_product(product: Product):
    return product