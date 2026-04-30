from fastapi import APIRouter, Depends, status
from typing import Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import Attendance, Enrollments, Students, Courses, Teachers, Users
from src.schemas.attendance import AttendanceCreate, AttendanceUpdate
from src.auth import get_current_user, check_admin_or_teacher_role
from src.response import success_response
from src.services import attendance_service as utils

router = APIRouter(tags=["Attendance"])
response = success_response

@router.post("/attendance/", status_code=status.HTTP_201_CREATED)
async def create_attendance(attendance: AttendanceCreate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    result = await db.execute(
        select(Attendance).where(Attendance.e_id == attendance.e_id, Attendance.attendance_date == attendance.attendance_date)
    )
    db_att = result.scalar_one_or_none()
    if db_att:
        db_att.status = attendance.status
        msg = "Attendance updated successfully"
    else:
        db_att = Attendance(**attendance.model_dump())
        db.add(db_att)
        msg = "Attendance marked successfully"
    await db.commit()
    await db.refresh(db_att)
    return response(data=db_att, message=msg)

@router.get("/attendance/available-students")
async def get_available_students(
    db: AsyncSession = Depends(get_db), 
    current_user: Users = Depends(check_admin_or_teacher_role)
):
    query = select(Enrollments).options(joinedload(Enrollments.s), joinedload(Enrollments.c))
    
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = query.join(Courses, Enrollments.c_id == Courses.c_id).where(Courses.t_id == teacher.t_id)
        
    result = await db.execute(query)
    rows = result.scalars().all()
    data = []
    for row in rows:
        data.append({
            "e_id": row.e_id,
            "c_id": row.c_id,
            "student_name": row.s.name if row.s else "Unknown",
            "roll_no": row.s.roll_no if row.s else "N/A",
            "course_title": row.c.title if row.c else "Unknown"
        })
    return response(data=data, message="Available students retrieved successfully")

@router.get("/attendance/")
async def read_attendance(
    skip: int = 0, limit: int = 5, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Attendance).options(joinedload(Attendance.e).joinedload(Enrollments.s))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = (query
                 .join(Enrollments, Attendance.e_id == Enrollments.e_id)
                 .join(Courses, Enrollments.c_id == Courses.c_id)
                 .where(Courses.t_id == teacher.t_id))
    if search:
        query = (query
                 .join(Enrollments, Attendance.e_id == Enrollments.e_id, isouter=True)
                 .join(Students, Enrollments.s_id == Students.s_id, isouter=True)
                 .where(Students.name.ilike(f"%{search}%") | Students.roll_no.ilike(f"%{search}%") | Attendance.status.ilike(f"%{search}%")))
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    rows = result.scalars().all()
    data = []
    for row in rows:
        item = jsonable_encoder(row)
        student = row.e.s if row.e else None
        item["student_name"] = student.name if student else "Unknown"
        item["roll_no"] = student.roll_no if student else "N/A"
        data.append(item)
    return response(data=data, total=total, message="Attendance records retrieved successfully")

@router.patch("/attendance/{a_id}")
async def update_attendance(a_id: int, update: AttendanceUpdate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    data = await utils.update_attendance_service(a_id, update.model_dump(), db)
    return response(data=data, message="Attendance record updated successfully")

@router.delete("/attendance/{a_id}")
async def delete_attendance(a_id: int, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    await utils.delete_attendance_service(a_id, db)
    return response(message="Attendance record deleted successfully")
