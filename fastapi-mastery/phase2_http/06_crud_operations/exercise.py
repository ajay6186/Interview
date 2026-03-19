# =============================================================================
# EXERCISE 06: CRUD Operations (GET, POST, PUT, DELETE)
# =============================================================================
# GOAL: Build a complete in-memory CRUD API for a "products" resource.
#
# CONCEPTS:
#   - @app.get()    -> Read
#   - @app.post()   -> Create
#   - @app.put()    -> Full update (replace)
#   - @app.patch()  -> Partial update
#   - @app.delete() -> Delete
#   - HTTPException for 404 errors
#   - In-memory dict as fake database
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Use: http://127.0.0.1:8000/docs
#
# =============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


# --- Data Model ---
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


# --- In-memory "database" ---
products_db: dict[int, dict] = {
    1: {"id": 1, "name": "Laptop", "description": "A powerful laptop", "price": 999.99, "in_stock": True},
    2: {"id": 2, "name": "Phone", "description": "Latest smartphone", "price": 499.99, "in_stock": True},
}
next_id = 3  # auto-increment counter


# TODO 1: GET "/products" - return all products as a list
#   Return: list(products_db.values())

@app.get("/products")
def get_products():
    return list(products_db.values())

# TODO 2: GET "/products/{product_id}" - return a single product
#   - If product_id not in products_db, raise HTTPException(status_code=404, detail="Product not found")
#   Hint: raise HTTPException(status_code=404, detail="Product not found")

@app.get("/products/{product_id}")
def get_product(product_id: int):
    data = products_db.get(product_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return data

# TODO 3: POST "/products" - create a new product
#   - Use the global next_id as the new product's id
#   - Increment next_id after use
#   - Store {"id": next_id, **product.model_dump()} in products_db
#   - Return the created product with status_code=201
#   Hint: from fastapi import status  and  response.status_code = status.HTTP_201_CREATED
#   OR simpler: add status_code=201 to the decorator: @app.post("/products", status_code=201)

@app.post("/products")
def create_product(product: Product):
    global next_id
    new_product = {"id": next_id, **product.model_dump()}
    products_db[next_id] = new_product
    next_id += 1
    return new_product

# TODO 4: PUT "/products/{product_id}" - full update (replace all fields)
#   - If not found, raise 404
#   - Replace the stored product with the new data (keep the same id)
#   - Return the updated product

@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product):
    if project_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = {"id": product_id, **product.model_dump()}
    products_db[product_id] = updated
    return updated

# TODO 5: PATCH "/products/{product_id}" - partial update
#   - If not found, raise 404
#   - Only update fields that are NOT None in the ProductUpdate body
#   Hint: update_data = product.model_dump(exclude_unset=True)
#         products_db[product_id].update(update_data)
#   - Return the updated product

@app.patch("/products/{product_id}")
def partial_update_product(product_id: int, product: ProductUpdate):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    updated_data = product.model_dump(exclude_unset=True)
    products_db[product_id].update(updated_data)
    return products_db[product_id]

# TODO 6: DELETE "/products/{product_id}" - delete a product
#   - If not found, raise 404
#   - Delete from products_db
#   - Return {"message": "Product deleted successfully"}

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    del products_db[product_id]
    return {"message": "Product deleted successfully"}