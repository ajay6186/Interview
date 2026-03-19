# =============================================================================
# EXERCISE 12: Nested Dependencies & Dependency Scopes
# =============================================================================
# GOAL: Chain dependencies together and understand yield dependencies.
#
# CONCEPTS:
#   - Dependencies that depend on other dependencies
#   - "yield" dependencies (setup + teardown, like DB sessions)
#   - dependencies= param on routers and app level
#   - Dependency overrides (for testing)
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#
# =============================================================================

from fastapi import FastAPI, Depends, HTTPException, Header
from typing import Optional, Generator

app = FastAPI()


# --- Simulated DB session ---
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


# TODO 1: Create a "get_db" yield dependency
#   - Create a FakeDB instance
#   - yield it (so endpoint can use it)
#   - After yield: call db.close() and print("DB closed")
#   Hint:
#     def get_db() -> Generator:
#         db = FakeDB()
#         try:
#             yield db
#         finally:
#             db.close()
#             print("DB closed")

def get_db() -> Generator:
    db = FakeDB()
    try:
        yield db
    finally:
        db.close()
        print("DB connection closed")
        

# TODO 2: Create GET "/users" and GET "/products" that use get_db
#   def list_users(db: FakeDB = Depends(get_db)):
#       return db.query("users")

@app.get("/users")
def list_users(db: FakeDB = Depends(get_db)):
    return db.query("users")


@app.get("/products")
def list_products(db: FakeDB = Depends(get_db)):
    return db.query("products")

# --- Nested dependency example ---
# TODO 3: Create these chained dependencies:
#
#   def get_token(x_token: str = Header(...)):
#       # x_token header must equal "secret-token"
#       if x_token != "secret-token":
#           raise HTTPException(401, detail="Invalid token")
#       return x_token
#
#   def get_current_user(token: str = Depends(get_token)):
#       # pretend to decode token -> return user
#       return {"username": "alice", "token": token}
#
# Then create GET "/me" that uses get_current_user
#   - Return the current user
#   - Test: add header X-Token: secret-token in Swagger docs

def get_token(x_token:str = Header(...)):
    if x_token != "secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return x_token

def get_current_user(token: str = Depends(get_token)):
    return {"usrname": "alice", "token": token}

@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user

# TODO 4: Dependency override for testing
#   - Define a function "override_get_db" that returns a FakeDB with custom data
#   - Show how you would override: app.dependency_overrides[get_db] = override_get_db
#   - Then reset: app.dependency_overrides = {}
#   (Just write this as a comment or in a separate test block — no need to run)
