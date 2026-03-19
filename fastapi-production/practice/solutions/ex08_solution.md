# Exercise 8 Solution — Change password endpoint

---

## Step 1 — Schema (`app/schemas/user.py`)

```python
class ChangePasswordRequest(AppBaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must be ≥8 chars and contain uppercase, lowercase, and a digit"
            )
        return v
```

---

## Step 2 — Service (`app/services/user_service.py`)

```python
async def change_password(
    self, user_id: int, current_password: str, new_password: str
) -> None:
    user = await self.get_user(user_id)
    if not verify_password(current_password, user.hashed_password):
        raise BadRequestException("Current password is incorrect.")
    await self._repo.update(user, {"hashed_password": hash_password(new_password)})
```

---

## Step 3 — Endpoint (`app/api/v1/endpoints/users.py`)

```python
from app.schemas.user import ChangePasswordRequest

@router.post(
    "/me/change-password",
    response_model=MessageResponse,
    summary="Change the authenticated user's password",
)
async def change_password(
    db: DBSession,
    current_user: CurrentUser,
    payload: ChangePasswordRequest,
) -> MessageResponse:
    service = UserService(db)
    await service.change_password(
        current_user.id,
        payload.current_password,
        payload.new_password,
    )
    return MessageResponse(message="Password changed successfully.")
```

---

## Test to write

```python
async def test_change_password(client, regular_user, regular_user_token):
    resp = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "Password1", "new_password": "NewPass2"},
        headers=auth_headers(regular_user_token),
    )
    assert resp.status_code == 200

    # verify new password works for login
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": regular_user.email, "password": "NewPass2"},
    )
    assert login.status_code == 200


async def test_change_password_wrong_current(client, regular_user_token):
    resp = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "WrongPass1", "new_password": "NewPass2"},
        headers=auth_headers(regular_user_token),
    )
    assert resp.status_code == 400
```
