from fastapi import APIRouter, Depends, status
from typing import Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import Examination, Teachers, Courses, Users
from src.schemas.exam import ExaminationCreate, ExaminationUpdate
from src.auth import get_current_user, check_admin_role, check_admin_or_teacher_role
from src.response import success_response, raise_exception
from src.services import examination_service as utils

router = APIRouter(tags=["Examinations"])
response = success_response
CustomException = raise_exception

@router.get("/examinations/available-courses")
async def get_available_courses(
    db: AsyncSession = Depends(get_db), 
    admin: Users = Depends(check_admin_role)
):
    result = await db.execute(select(Courses))
    courses = result.scalars().all()
    data = [{"c_id": c.c_id, "title": c.title} for c in courses]
    return response(data=data, message="Available courses retrieved successfully")


@router.post("/examinations/", status_code=status.HTTP_201_CREATED)
async def create_examination(examination: ExaminationCreate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    existing = await db.execute(
        select(Examination).where(Examination.c_id == examination.c_id, Examination.exam_date == examination.exam_date)
    )
    if existing.scalar_one_or_none():
        raise CustomException("An examination is already scheduled for this course on this date", status_code=400)
    db_ex = Examination(**examination.model_dump())
    db.add(db_ex)
    await db.commit()
    await db.refresh(db_ex)
    return response(data=db_ex, message="Examination created successfully")

@router.get("/examinations/")
async def read_examinations(
    skip: int = 0, limit: int = 100, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Examination).options(joinedload(Examination.c))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = query.join(Courses, Examination.c_id == Courses.c_id).where(Courses.t_id == teacher.t_id)
    if search:
        query = query.where(Examination.title.ilike(f"%{search}%") | Examination.status.ilike(f"%{search}%"))
    result = await db.execute(query.offset(skip).limit(limit))
    rows = result.scalars().all()
    data = []
    for row in rows:
        item = jsonable_encoder(row)
        item["course_title"] = row.c.title if row.c else "Unknown"
        data.append(item)
    return response(data=data, message="Examinations retrieved successfully")

@router.patch("/examinations/{ex_id}/status")
async def update_examination(ex_id: int, update: ExaminationUpdate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    result = await db.execute(select(Examination).where(Examination.ex_id == ex_id))
    db_ex = result.scalar_one_or_none()
    if not db_ex:
        raise CustomException("Examination not found", status_code=404)
    if update.status: db_ex.status = update.status
    if update.title: db_ex.title = update.title
    if update.exam_date: db_ex.exam_date = update.exam_date
    if update.c_id: db_ex.c_id = update.c_id
    await db.commit()
    await db.refresh(db_ex)
    return response(data=db_ex, message="Examination updated successfully")

@router.delete("/examinations/{ex_id}")
async def delete_examination(ex_id: int, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    await utils.delete_examination_service(ex_id, db)
    return response(message="Examination deleted successfully")
