from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Enrollments

error = raise_exception

async def update_enrollment_service(e_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(Enrollments).where(Enrollments.e_id == e_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment: raise error("Enrollment not found", 404)
    for k, v in data.items():
        if v is not None: setattr(enrollment, k, v)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

async def delete_enrollment_service(e_id: int, db: AsyncSession):
    result = await db.execute(select(Enrollments).where(Enrollments.e_id == e_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment: raise error("Enrollment not found", 404)
    await db.delete(enrollment)
    await db.commit()
    return True
