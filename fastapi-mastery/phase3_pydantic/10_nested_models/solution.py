# =============================================================================
# SOLUTION 10: Nested Pydantic Models
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, computed_field
from typing import Optional, List

app = FastAPI()


# --- Address ---
class Address(BaseModel):
    street: str
    city: str
    country: str
    postal_code: str


# --- OrderItem with computed total_price ---
class OrderItem(BaseModel):
    product_name: str
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., gt=0)

    @computed_field
    @property
    def total_price(self) -> float:
        return round(self.quantity * self.unit_price, 2)


# --- Order with nested Address + List[OrderItem] ---
class Order(BaseModel):
    customer_name: str
    shipping_address: Address
    items: List[OrderItem]
    discount_percent: float = Field(default=0.0, ge=0.0, le=100.0)

    @computed_field
    @property
    def subtotal(self) -> float:
        return round(sum(item.total_price for item in self.items), 2)

    @computed_field
    @property
    def total(self) -> float:
        return round(self.subtotal * (1 - self.discount_percent / 100), 2)


@app.post("/orders")
def create_order(order: Order):
    return order


# --- Optional nested model ---
class Profile(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None


class User(BaseModel):
    id: int
    name: str
    profile: Optional[Profile] = None


@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    if user_id == 1:
        return User(id=1, name="Alice", profile=Profile(bio="Developer", website="https://alice.dev"))
    if user_id == 2:
        return User(id=2, name="Bob", profile=None)
    raise HTTPException(status_code=404, detail="User not found")
