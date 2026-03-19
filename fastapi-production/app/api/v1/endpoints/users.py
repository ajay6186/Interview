"""
User CRUD endpoints.
"""
from fastapi import APIRouter, status

from app.core.dependencies import CurrentUser, DBSession, PaginationDep
from app.core.exceptions import ForbiddenException
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register_user(db: DBSession, payload: UserCreate) -> UserResponse:
    """
    Public endpoint — no auth required.
    Creates a new user account.
    """
    service = UserService(db)
    user = await service.create_user(payload)
    return UserResponse.model_validate(user)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the authenticated user's profile",
)
async def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update the authenticated user's profile",
)
async def update_me(
    db: DBSession,
    current_user: CurrentUser,
    payload: UserUpdate,
) -> UserResponse:
    service = UserService(db)
    updated = await service.update_user(current_user.id, payload)
    return UserResponse.model_validate(updated)


@router.get(
    "/",
    response_model=PaginatedResponse[UserListResponse],
    summary="List all users (superuser only)",
)
async def list_users(
    db: DBSession,
    current_user: CurrentUser,
    pagination: PaginationDep,
) -> PaginatedResponse[UserListResponse]:
    if not current_user.is_superuser:
        raise ForbiddenException("Superuser access required.")
    service = UserService(db)
    users, total = await service.list_users(skip=pagination.skip, limit=pagination.limit)
    return PaginatedResponse.create(
        items=[UserListResponse.model_validate(u) for u in users],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get a user by ID (superuser only)",
)
async def get_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser,
) -> UserResponse:
    if not current_user.is_superuser and current_user.id != user_id:
        raise ForbiddenException("Access denied.")
    service = UserService(db)
    user = await service.get_user(user_id)
    return UserResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a user (superuser or self)",
)
async def delete_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser,
) -> MessageResponse:
    if not current_user.is_superuser and current_user.id != user_id:
        raise ForbiddenException("Access denied.")
    service = UserService(db)
    await service.delete_user(user_id)
    return MessageResponse(message=f"User {user_id} deleted successfully.")
