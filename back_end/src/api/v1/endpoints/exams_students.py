from fastapi import APIRouter, Depends, status
from typing import Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import ExamsStudents, Teachers, Courses, Examination, Students, Users
from src.schemas.exam import ExamsStudentCreate, ExamsStudentUpdate, ExamsStudentEdit
from src.auth import get_current_user, check_admin_role, check_admin_or_teacher_role
from src.response import success_response, raise_exception
from src.services import exams_student_service as utils

router = APIRouter(tags=["Exam Registrations"])
response = success_response
CustomException = raise_exception

@router.post("/exams-students/", status_code=status.HTTP_201_CREATED)
async def create_exams_student(exams_student: ExamsStudentCreate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    data = exams_student.model_dump()
    if auth.role == "teacher":
        data["status"] = "pending"
    db_es = ExamsStudents(**data)
    db.add(db_es)
    await db.commit()
    await db.refresh(db_es)
    return response(data=db_es, message="Exam registration successful")

@router.get("/exams-students/")
async def read_exams_students(
    skip: int = 0, limit: int = 5, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(ExamsStudents).options(joinedload(ExamsStudents.s), joinedload(ExamsStudents.ex))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = (query
                 .join(Examination, ExamsStudents.ex_id == Examination.ex_id)
                 .join(Courses, Examination.c_id == Courses.c_id)
                 .where(Courses.t_id == teacher.t_id))
    if search:
        query = (query
                 .join(Students, ExamsStudents.s_id == Students.s_id, isouter=True)
                 .where(Students.name.ilike(f"%{search}%") | ExamsStudents.status.ilike(f"%{search}%")))
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
        item["roll_no"] = row.s.roll_no if row.s else "N/A"
        item["exam_title"] = row.ex.title if row.ex else "Unknown"
        data.append(item)
    return response(data=data, total=total, message="Exam registrations retrieved successfully")

@router.patch("/exams-students/{es_id}/status")
async def update_exam_student_status(es_id: int, update: ExamsStudentUpdate, db: AsyncSession = Depends(get_db), admin: Users = Depends(check_admin_role)):
    result = await db.execute(select(ExamsStudents).where(ExamsStudents.es_id == es_id))
    db_es = result.scalar_one_or_none()
    if not db_es:
        raise CustomException("Exam registration not found", status_code=404)
    if update.status:
        db_es.status = update.status
    if update.student_status:
        db_es.student_status = update.student_status
    await db.commit()
    await db.refresh(db_es)
    return response(data=db_es, message="Exam registration status updated")

@router.patch("/exams-students/{es_id}/edit")
async def edit_exam_student(es_id: int, update: ExamsStudentEdit, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    data = await utils.update_exams_student_service(es_id, update.model_dump(), db)
    return response(data=data, message="Exam registration updated successfully")

@router.delete("/exams-students/{es_id}")
async def delete_exam_student(es_id: int, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    await utils.delete_exams_student_service(es_id, db)
    return response(message="Exam registration deleted successfully")
