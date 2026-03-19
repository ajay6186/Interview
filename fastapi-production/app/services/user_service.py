"""
User business logic — sits between the API layer and the repository.
No SQLAlchemy, no FastAPI concerns here; pure domain logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = UserRepository(db)

    async def create_user(self, payload: UserCreate) -> User:
        if await self._repo.email_exists(payload.email):
            raise ConflictException(f"Email '{payload.email}' is already registered.")
        if await self._repo.username_exists(payload.username):
            raise ConflictException(f"Username '{payload.username}' is already taken.")

        user = User(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
        )
        return await self._repo.create(user)

    async def get_user(self, user_id: int) -> User:
        user = await self._repo.get_by_id(user_id)
        if user is None:
            raise NotFoundException(f"User {user_id} not found.")
        return user

    async def list_users(self, *, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        users = await self._repo.get_all(skip=skip, limit=limit)
        total = await self._repo.count()
        return users, total

    async def update_user(self, user_id: int, payload: UserUpdate) -> User:
        user = await self.get_user(user_id)

        update_data: dict = payload.model_dump(exclude_none=True)

        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))

        if "email" in update_data and update_data["email"] != user.email:
            if await self._repo.email_exists(update_data["email"]):
                raise ConflictException(f"Email '{update_data['email']}' is already registered.")

        return await self._repo.update(user, update_data)

    async def delete_user(self, user_id: int) -> None:
        user = await self.get_user(user_id)
        await self._repo.delete(user)

    async def authenticate(self, email: str, password: str) -> User | None:
        user = await self._repo.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            return None
        return user
