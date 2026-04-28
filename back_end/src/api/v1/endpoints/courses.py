from fastapi import APIRouter, Depends, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.database import get_db
from src.models import Courses, Teachers, Users
from src.schemas.course import CourseCreate, CourseUpdate
from src.auth import get_current_user, check_admin_or_teacher_role
from src.response import success_response, raise_exception
from src.services import course_service as utils

router = APIRouter(tags=["Courses"])
response = success_response
CustomException = raise_exception

@router.post("/courses/", status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseCreate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    course_data = course.model_dump()
    if auth.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == auth.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            raise CustomException("Teacher profile not found", status_code=404)
        course_data["t_id"] = teacher.t_id

    if course_data.get("t_id"):
        existing = await db.execute(
            select(Courses).where(Courses.title == course_data["title"], Courses.t_id == course_data["t_id"])
        )
        if existing.scalar_one_or_none():
            raise CustomException("This course already exists for this teacher", status_code=400)

    db_course = Courses(**course_data)
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return response(data=db_course, message="Course created successfully")

@router.get("/courses/")
async def read_courses(
    skip: int = 0, limit: int = 100, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Courses)
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = query.where(Courses.t_id == teacher.t_id)
    if search:
        query = query.where(Courses.title.ilike(f"%{search}%") | Courses.description.ilike(f"%{search}%"))
    result = await db.execute(query.offset(skip).limit(limit))
    return response(data=result.scalars().all(), message="Courses retrieved successfully")

@router.patch("/courses/{c_id}")
async def update_course(c_id: int, update: CourseUpdate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    data = await utils.update_course_service(c_id, update.model_dump(), db)
    return response(data=data, message="Course updated successfully")

@router.delete("/courses/{c_id}")
async def delete_course(c_id: int, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    await utils.delete_course_service(c_id, db)
    return response(message="Course deleted successfully")
