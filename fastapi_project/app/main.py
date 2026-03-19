from fastapi import FastAPI
from app.routers import user_router
app = FastAPI()

# app.include_router(user_router.router)
app.include_router(user_router.router)

@app.get("/")
def home():
    return {"message": "FastAPI Project Running"}