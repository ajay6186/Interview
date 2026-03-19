# =============================================================================
# EXERCISE 13: JWT Authentication
# =============================================================================
# GOAL: Implement a complete JWT login + protected routes system.
#
# CONCEPTS:
#   - OAuth2PasswordBearer (token from Authorization header)
#   - OAuth2PasswordRequestForm (username + password from form)
#   - python-jose for JWT encode/decode
#   - passlib for password hashing
#   - Token expiry with timedelta
#   - Protected routes with Depends
#
# INSTALL:
#   pip install python-jose[cryptography] passlib[bcrypt] python-multipart
#
# HOW TO RUN:
#   uvicorn exercise:app --reload
#   Use Swagger: click "Authorize" -> enter username/password -> get token
#
# =============================================================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional

app = FastAPI()

# --- Config ---
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Fake user database ---
fake_users_db = {
    "alice": {
        "username": "alice",
        "hashed_password": pwd_context.hash("secret123"),
        "email": "alice@example.com",
        "disabled": False,
    },
    "bob": {
        "username": "bob",
        "hashed_password": pwd_context.hash("password456"),
        "email": "bob@example.com",
        "disabled": True,  # disabled user
    },
}


# --- Models ---
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str
    email: str
    disabled: bool = False


# TODO 1: Write "verify_password(plain_password, hashed_password) -> bool"
#   Use: pwd_context.verify(plain, hashed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# TODO 2: Write "get_user(db, username) -> dict | None"
#   - Look up username in db dict, return the user dict or None

def get_user(db: dict, username: str):
    return db.get(username)


# TODO 3: Write "authenticate_user(db, username, password) -> dict | False"
#   - Get user, verify password
#   - Return user dict if valid, False otherwise

def authenticate_user(db: dict, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

# TODO 4: Write "create_access_token(data: dict, expires_delta: timedelta) -> str"
#   - Copy data, add "exp" field = now + expires_delta
#   - Return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# TODO 5: Write "get_current_user(token: str = Depends(oauth2_scheme))"
#   - Decode token with jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#   - Extract username from payload.get("sub")
#   - If invalid, raise HTTPException(401, "Could not validate credentials",
#                                     headers={"WWW-Authenticate": "Bearer"})
#   - Look up and return the user

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username)
    if user is None:
        raise credentials_exception
    return user

# TODO 6: Write "get_current_active_user(current_user = Depends(get_current_user))"
#   - If current_user["disabled"] is True, raise HTTPException(400, "Inactive user")
#   - Return current_user

def get_current_Active_user(current_user: dict = Depends(get_current_user)):
    if current_user["disabled"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# TODO 7: POST "/token" endpoint
#   - Accept OAuth2PasswordRequestForm (form data, not JSON)
#   - Authenticate user, raise 401 if invalid
#   - Create token with {"sub": username} and expiry
#   - Return Token(access_token=token, token_type="bearer")
#   Hint: form_data: OAuth2PasswordRequestForm = Depends()

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data = {"sub": user["username"]},
        expires_delta=timedelta(minutes= ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer")
    
    
    
# TODO 8: GET "/users/me" - protected endpoint
#   - Depends on get_current_active_user
#   - Return the current user info

@app.get("/users/me", response_model=User)
def read_me(current_user: dict = Depends(get_current_Active_user)):
    return current_user


# TODO 9: GET "/users/me/items" - also protected
#   - Return fake items owned by the user:
#     [{"item": "Widget", "owner": user["username"]},
#      {"item": "Gadget", "owner": user["username"]}]

@app.get("/users/me/items")
def read_my_items(current_user: dict = Depends(get_current_Active_user)):
    return [
        {"item": "Widget", "owner": current_user["username"]},
        {"item": "Gadget", "owner": current_user["username"]},
    ]