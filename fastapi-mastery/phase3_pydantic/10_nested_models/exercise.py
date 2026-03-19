# =============================================================================
# EXERCISE 10: Nested Pydantic Models
# =============================================================================
# GOAL: Model complex, real-world data with nested and list structures.
#
# CONCEPTS:
#   - Nested models (model inside model)
#   - List of nested models
#   - Optional nested models
#   - model_dump() with nested objects
#   - Real-world shape: Order -> [OrderItem -> Product]
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

app = FastAPI()


# TODO 1: Create these nested models:
#
#   class Address(BaseModel):
#       street: str
#       city: str
#       country: str
#       postal_code: str
#
#   class OrderItem(BaseModel):
#       product_name: str
#       quantity: int  (ge=1)
#       unit_price: float  (gt=0)
#       # computed property: total_price = quantity * unit_price
#
#   class Order(BaseModel):
#       customer_name: str
#       shipping_address: Address           <- nested model!
#       items: List[OrderItem]             <- list of nested models
#       discount_percent: float = 0.0      (ge=0, le=100)
#       # computed property: subtotal = sum(item.total_price for item in items)
#       # computed property: total = subtotal * (1 - discount_percent / 100)


# TODO 2: Create POST "/orders"
#   - Accept an Order
#   - Return the full order (nested objects and computed fields auto-included)
#
#   Test JSON:
#   {
#     "customer_name": "Alice",
#     "shipping_address": {
#       "street": "123 Main St",
#       "city": "New York",
#       "country": "USA",
#       "postal_code": "10001"
#     },
#     "items": [
#       {"product_name": "Laptop", "quantity": 1, "unit_price": 999.99},
#       {"product_name": "Mouse", "quantity": 2, "unit_price": 29.99}
#     ],
#     "discount_percent": 10.0
#   }
#   Expected: subtotal=1059.97, total=953.97 (approx)


# TODO 3: Create a "Profile" model:
#   class Profile(BaseModel):
#       bio: Optional[str] = None
#       website: Optional[str] = None
#
#   class User(BaseModel):
#       id: int
#       name: str
#       profile: Optional[Profile] = None   <- optional nested model
#
# Create GET "/users/{user_id}" that returns a hardcoded User
# where user_id=1 has a profile, user_id=2 has profile=None
