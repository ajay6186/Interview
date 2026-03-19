# =============================================================================
# SOLUTION 06: CRUD Operations
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


class Product(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    in_stock: Optional[bool] = None


products_db: dict[int, dict] = {
    1: {"id": 1, "name": "Laptop", "description": "A powerful laptop", "price": 999.99, "in_stock": True},
    2: {"id": 2, "name": "Phone", "description": "Latest smartphone", "price": 499.99, "in_stock": True},
}
next_id = 3


# --- GET all ---
@app.get("/products")
def list_products():
    return list(products_db.values())


# --- GET one ---
@app.get("/products/{product_id}")
def get_product(product_id: int):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    return products_db[product_id]


# --- POST create ---
@app.post("/products", status_code=201)
def create_product(product: Product):
    global next_id
    new_product = {"id": next_id, **product.model_dump()}
    products_db[next_id] = new_product
    next_id += 1
    return new_product


# --- PUT full update ---
@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = {"id": product_id, **product.model_dump()}
    products_db[product_id] = updated
    return updated


# --- PATCH partial update ---
@app.patch("/products/{product_id}")
def partial_update_product(product_id: int, product: ProductUpdate):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    update_data = product.model_dump(exclude_unset=True)
    products_db[product_id].update(update_data)
    return products_db[product_id]


# --- DELETE ---
@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    del products_db[product_id]
    return {"message": "Product deleted successfully"}

