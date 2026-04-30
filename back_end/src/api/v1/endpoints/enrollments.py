from fastapi import APIRouter, Depends, status
from typing import Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import Enrollments, Teachers, Courses, Students, Users
from src.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate
from src.auth import get_current_user, check_admin_role
from src.response import success_response
from src.services import enrollment_service as utils

router = APIRouter(tags=["Enrollments"])
response = success_response

@router.post("/enrollments/", status_code=status.HTTP_201_CREATED)
async def create_enrollment(enrollment: EnrollmentCreate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    db_enrollment = Enrollments(**enrollment.model_dump())
    db.add(db_enrollment)
    await db.commit()
    await db.refresh(db_enrollment)
    return response(data=db_enrollment, message="Enrollment created successfully")

@router.get("/enrollments/")
async def read_enrollments(
    skip: int = 0, limit: int = 5, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Enrollments).options(joinedload(Enrollments.s), joinedload(Enrollments.c))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = query.join(Courses, Enrollments.c_id == Courses.c_id).where(Courses.t_id == teacher.t_id)
    if search:
        query = query.join(Students, Enrollments.s_id == Students.s_id, isouter=True)
        query = query.join(Courses, Enrollments.c_id == Courses.c_id, isouter=True)
        query = query.where(Students.name.ilike(f"%{search}%") | Courses.title.ilike(f"%{search}%"))
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    rows = result.scalars().all()
    data = []
    for row in rows:
        item = jsonable_encoder(row)
        item["student_name"] = row.s.name if row.s else "Unknown"
        item["course_title"] = row.c.title if row.c else "Unknown"
        data.append(item)
    return response(data=data, total=total, message="Enrollments retrieved successfully")

@router.patch("/enrollments/{e_id}")
async def update_enrollment(e_id: int, update: EnrollmentUpdate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    data = await utils.update_enrollment_service(e_id, update.model_dump(), db)
    return response(data=data, message="Enrollment updated successfully")

@router.delete("/enrollments/{e_id}")
async def delete_enrollment(e_id: int, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    await utils.delete_enrollment_service(e_id, db)
    return response(message="Enrollment deleted successfully")
