from fastapi import APIRouter, Depends, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.models import Users
from src.schemas.user import UserRegistration, UserUpdate
from src.auth import check_admin_role, check_admin_or_teacher_role
from src.response import success_response
from src.services import user_service as utils

router = APIRouter(tags=["Users"])
response = success_response

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserRegistration, db: AsyncSession = Depends(get_db)):
    data = await utils.create_user_service(user_data, db)
    return response(data=data, message="User registered successfully")

@router.get("/users/")
async def read_users(role_option: Optional[int] = None, skip: int = 0, limit: int = 100, search: Optional[str] = None, db: AsyncSession = Depends(get_db), auth_user: Users = Depends(check_admin_or_teacher_role)):
    teacher_id = auth_user.u_id if auth_user.role == 'teacher' else None
    data = await utils.read_users_service(role_option, skip, limit, db, search, teacher_u_id=teacher_id)
    return response(data=data, message="Users retrieved successfully")

@router.get("/users/{u_id}")
async def read_user(u_id: int, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    data = await utils.read_user_by_id_service(u_id, db)
    return response(data=data, message="User details retrieved successfully")

@router.patch("/users/{u_id}")
async def update_user(u_id: int, update: UserUpdate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    data = await utils.update_user_service(u_id, update.model_dump(), db)
    return response(data=data, message="User updated successfully")

@router.delete("/users/{u_id}")
async def delete_user(u_id: int, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    await utils.delete_user_service(u_id, db)
    return response(message="User deleted successfully")
