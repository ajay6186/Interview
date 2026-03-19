# =============================================================================
# SOLUTION 09: Pydantic Models Deep Dive
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator, model_validator, computed_field
from typing import Optional

app = FastAPI()


# --- UserRegister with custom validators ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: str
    password: str = Field(..., min_length=8)
    confirm_password: str
    age: Optional[int] = Field(default=None, ge=18)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email address")
        return v.lower()

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


# --- Product with computed field ---
class Product(BaseModel):
    name: str
    price: float = Field(..., gt=0)
    discount: float = Field(default=0.0, ge=0.0, lt=1.0)

    @computed_field
    @property
    def final_price(self) -> float:
        return round(self.price * (1 - self.discount), 2)


# --- Endpoints ---
@app.post("/register")
def register(user: UserRegister):
    return {"message": "User registered", "username": user.username, "email": user.email}


@app.post("/products")
def create_product(product: Product):
    return product
