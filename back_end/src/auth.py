import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from pydantic import BaseModel

from .response import raise_exception
from .database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models.users import Users
from .core.config import settings, logger

# Configuration from centralized settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
response = raise_exception
# Token schemas removed as requested. Standard OAuth2PasswordBearer is used.

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """
    FastAPI dependency to get the current user from a JWT token.
    Fetches the user from the database to ensure they still exist and to get their role.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise response(
                message="Could not validate credentials",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
    except JWTError:
        raise response(
            message="Could not validate credentials",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Fetch user from DB (case-insensitive to match login behaviour)
    query = select(Users).where(Users.email.ilike(email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise response(
            message="User not found",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    return user

async def check_admin_role(current_user: Users = Depends(get_current_user)):
    """Checks if the current user has the 'admin' role."""
    if current_user.role != "admin":
        raise response(
            message="Access forbidden: Admin rights required",
            status_code=status.HTTP_403_FORBIDDEN
        )
    return current_user

async def check_admin_or_teacher_role(current_user: Users = Depends(get_current_user)):
    """Checks if the current user has the 'admin' or 'teacher' role."""
    if current_user.role not in ["admin", "teacher"]:
        raise response(
            message="Access forbidden: Admin or Teacher rights required",
            status_code=status.HTTP_403_FORBIDDEN
        )
    return current_user
