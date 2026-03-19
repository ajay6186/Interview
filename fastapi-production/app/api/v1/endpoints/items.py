"""
Item CRUD endpoints.
"""
from fastapi import APIRouter, status

from app.core.dependencies import CurrentUser, DBSession, PaginationDep
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.item import ItemCreate, ItemListResponse, ItemResponse, ItemUpdate
from app.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["Items"])


@router.post(
    "/",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new item",
)
async def create_item(
    db: DBSession,
    current_user: CurrentUser,
    payload: ItemCreate,
) -> ItemResponse:
    service = ItemService(db)
    item = await service.create_item(payload, owner=current_user)
    return ItemResponse.model_validate(item)


@router.get(
    "/",
    response_model=PaginatedResponse[ItemListResponse],
    summary="List all items (paginated)",
)
async def list_items(
    db: DBSession,
    pagination: PaginationDep,
) -> PaginatedResponse[ItemListResponse]:
    """Public endpoint — returns all items."""
    service = ItemService(db)
    items, total = await service.list_items(skip=pagination.skip, limit=pagination.limit)
    return PaginatedResponse.create(
        items=[ItemListResponse.model_validate(i) for i in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get(
    "/mine",
    response_model=PaginatedResponse[ItemListResponse],
    summary="List items owned by the authenticated user",
)
async def list_my_items(
    db: DBSession,
    current_user: CurrentUser,
    pagination: PaginationDep,
) -> PaginatedResponse[ItemListResponse]:
    service = ItemService(db)
    items, total = await service.list_my_items(
        current_user.id, skip=pagination.skip, limit=pagination.limit
    )
    return PaginatedResponse.create(
        items=[ItemListResponse.model_validate(i) for i in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Get a single item by ID",
)
async def get_item(item_id: int, db: DBSession) -> ItemResponse:
    service = ItemService(db)
    item = await service.get_item(item_id)
    return ItemResponse.model_validate(item)


@router.patch(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Update an item (owner only)",
)
async def update_item(
    item_id: int,
    db: DBSession,
    current_user: CurrentUser,
    payload: ItemUpdate,
) -> ItemResponse:
    service = ItemService(db)
    item = await service.update_item(item_id, payload, requesting_user=current_user)
    return ItemResponse.model_validate(item)


@router.delete(
    "/{item_id}",
    response_model=MessageResponse,
    summary="Delete an item (owner only)",
)
async def delete_item(
    item_id: int,
    db: DBSession,
    current_user: CurrentUser,
) -> MessageResponse:
    service = ItemService(db)
    await service.delete_item(item_id, requesting_user=current_user)
    return MessageResponse(message=f"Item {item_id} deleted successfully.")
