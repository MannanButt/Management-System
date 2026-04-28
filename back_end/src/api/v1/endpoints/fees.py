from fastapi import APIRouter, Depends, status
from typing import Optional
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import Fees, Teachers, Courses, Enrollments, Students, Users
from src.schemas.fee import FeeCreate, FeeUpdate
from src.auth import get_current_user, check_admin_role
from src.response import success_response, raise_exception
from src.services import fee_service as utils

router = APIRouter(tags=["Fees"])
response = success_response
CustomException = raise_exception

@router.post("/fees/", status_code=status.HTTP_201_CREATED)
async def create_fee(fee: FeeCreate, db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)):
    if current_user.role == "student":
        s_result = await db.execute(select(Students).where(Students.u_id == current_user.u_id))
        student = s_result.scalar_one_or_none()
        if not student or student.s_id != fee.s_id:
            raise CustomException("You can only create fee requests for yourself", status_code=403)
    elif current_user.role != "admin":
        raise CustomException("Unauthorized", status_code=403)

    fee_data = fee.model_dump()
    fee_data["status"] = "pending"
    db_fee = Fees(**fee_data)
    db.add(db_fee)
    await db.commit()
    await db.refresh(db_fee)
    return response(data=db_fee, message="Fee record created successfully")

@router.get("/fees/")
async def read_fees(
    skip: int = 0, limit: int = 100, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Fees).options(joinedload(Fees.s))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = (query
                 .join(Enrollments, Fees.s_id == Enrollments.s_id)
                 .join(Courses, Enrollments.c_id == Courses.c_id)
                 .where(Courses.t_id == teacher.t_id))
    elif current_user.role == "student":
        s_result = await db.execute(select(Students).where(Students.u_id == current_user.u_id))
        student = s_result.scalar_one_or_none()
        if not student:
            return response(data=[], message="Student profile not found")
        query = query.where(Fees.s_id == student.s_id)

    if search:
        query = query.join(Students, Fees.s_id == Students.s_id, isouter=True)
        query = query.where(Students.name.ilike(f"%{search}%") | Fees.status.ilike(f"%{search}%"))
        
    result = await db.execute(query.offset(skip).limit(limit))
    rows = result.scalars().all()
    data = []
    for row in rows:
        item = jsonable_encoder(row)
        item["student_name"] = row.s.name if row.s else "Unknown"
        item["student"] = jsonable_encoder(row.s) if row.s else None
        data.append(item)
    return response(data=data, message="Fees retrieved successfully")

@router.patch("/fees/{f_id}/status")
async def update_fee_status(f_id: int, update: FeeUpdate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    result = await db.execute(select(Fees).where(Fees.f_id == f_id))
    db_fee = result.scalar_one_or_none()
    if not db_fee:
        raise CustomException("Fee record not found", status_code=404)
    if update.status:
        db_fee.status = update.status
    if update.paid_at:
        db_fee.paid_at = update.paid_at
    elif update.status == "paid" and not db_fee.paid_at:
        db_fee.paid_at = datetime.now()
    await db.commit()
    await db.refresh(db_fee)
    return response(data=db_fee, message="Fee status updated successfully")

@router.delete("/fees/{f_id}")
async def delete_fee(f_id: int, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    await utils.delete_fee_service(f_id, db)
    return response(message="Fee record deleted successfully")
