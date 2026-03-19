# =============================================================================
# SOLUTION 12: Nested Dependencies & Yield Dependencies
# =============================================================================
# HOW TO RUN:
#   uvicorn solution:app --reload
#   In Swagger docs, add header: X-Token: secret-token
# =============================================================================

from fastapi import FastAPI, Depends, HTTPException, Header
from typing import Generator

app = FastAPI()


# --- Simulated DB ---
class FakeDB:
    def __init__(self):
        self.connected = True
        self.data = {
            "users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
            "products": [{"id": 1, "name": "Widget"}, {"id": 2, "name": "Gadget"}],
        }

    def query(self, table: str):
        return self.data.get(table, [])

    def close(self):
        self.connected = False


# --- yield dependency (setup + teardown) ---
def get_db() -> Generator:
    db = FakeDB()
    try:
        yield db
    finally:
        db.close()
        print("DB connection closed")


@app.get("/users")
def list_users(db: FakeDB = Depends(get_db)):
    return db.query("users")


@app.get("/products")
def list_products(db: FakeDB = Depends(get_db)):
    return db.query("products")


# --- Nested dependencies ---
def get_token(x_token: str = Header(...)):
    if x_token != "secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return x_token


def get_current_user(token: str = Depends(get_token)):
    # In real code, decode JWT here
    return {"username": "alice", "token": token}


@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user


# --- Testing with dependency override (example, not running) ---
# def override_get_db():
#     db = FakeDB()
#     db.data["users"] = [{"id": 99, "name": "Test User"}]
#     yield db
#
# To override in tests:
#   app.dependency_overrides[get_db] = override_get_db
# To reset:
#   app.dependency_overrides = {}
