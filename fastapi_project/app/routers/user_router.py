from fastapi import APIRouter
from app.schemas.user_schema import UserCreate

router = APIRouter(
    prefix="/users",
    tags = ["Users"]
)

@router.get("/")
def get_users():
    return {"message": "All users"}

@router.post("/")
def create_user(user: UserCreate):
    return {
        "name": user.name,
        "email": user.email
    }