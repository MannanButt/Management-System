from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import ExamsStudents

error = raise_exception

async def update_exams_student_service(es_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(ExamsStudents).where(ExamsStudents.es_id == es_id))
    exams_student = result.scalar_one_or_none()
    if not exams_student: raise error("Exam registration not found", 404)
    for k, v in data.items():
        if v is not None: setattr(exams_student, k, v)
    await db.commit()
    await db.refresh(exams_student)
    return exams_student

async def delete_exams_student_service(es_id: int, db: AsyncSession):
    result = await db.execute(select(ExamsStudents).where(ExamsStudents.es_id == es_id))
    exams_student = result.scalar_one_or_none()
    if not exams_student: raise error("Exam registration not found", 404)
    await db.delete(exams_student)
    await db.commit()
    return True
