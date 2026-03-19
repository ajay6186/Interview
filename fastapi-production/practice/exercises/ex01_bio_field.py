"""
Exercise 1 — Add a `bio` field to User
=======================================
Goal: Users should be able to store an optional biography (max 500 chars).

Steps:
  1. Add `bio` column to the User ORM model
  2. Add `bio` field to UserCreate, UserUpdate, UserResponse schemas
  3. Generate and apply a migration

Run this file to check your work:
  python practice/exercises/ex01_bio_field.py
"""
import asyncio
import sys
import os

# make sure the project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


async def check():
    errors = []

    # ── Check 1: model has bio column ────────────────────────────────────────
    from app.models.user import User
    if not hasattr(User, "bio"):
        errors.append("FAIL  User model is missing the 'bio' column")
    else:
        col = User.__table__.columns.get("bio")
        if col is None:
            errors.append("FAIL  'bio' is not a mapped DB column on User")
        elif str(col.type) not in ("VARCHAR(500)", "TEXT"):
            errors.append(f"FAIL  bio column type should be VARCHAR(500), got {col.type}")
        else:
            print("PASS  User.bio column exists with correct type")

    # ── Check 2: schemas include bio ─────────────────────────────────────────
    from app.schemas.user import UserCreate, UserUpdate, UserResponse

    for schema_cls in (UserCreate, UserUpdate, UserResponse):
        fields = schema_cls.model_fields
        if "bio" not in fields:
            errors.append(f"FAIL  {schema_cls.__name__} is missing the 'bio' field")
        else:
            print(f"PASS  {schema_cls.__name__} has 'bio' field")

    # ── Check 3: UserCreate validates max_length ──────────────────────────────
    from pydantic import ValidationError
    try:
        UserCreate(
            email="test@test.com",
            username="tester",
            password="Password1",
            bio="x" * 501,          # one char too long
        )
        errors.append("FAIL  UserCreate should reject bio longer than 500 chars")
    except ValidationError:
        print("PASS  UserCreate rejects bio > 500 chars")

    # ── Check 4: UserCreate accepts valid bio ─────────────────────────────────
    try:
        u = UserCreate(
            email="test@test.com",
            username="tester",
            password="Password1",
            bio="I love Python",
        )
        assert u.bio == "I love Python"
        print("PASS  UserCreate accepts valid bio")
    except Exception as exc:
        errors.append(f"FAIL  UserCreate should accept valid bio — {exc}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    if errors:
        for e in errors:
            print(e)
        print(f"\n{len(errors)} check(s) failed — keep going!")
        sys.exit(1)
    else:
        print("All checks passed! Exercise 1 complete.")


if __name__ == "__main__":
    asyncio.run(check())
