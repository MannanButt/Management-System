from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Courses

error = raise_exception

async def update_course_service(c_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(Courses).where(Courses.c_id == c_id))
    course = result.scalar_one_or_none()
    if not course: raise error("Course not found", 404)
    for k, v in data.items():
        if v is not None: setattr(course, k, v)
    await db.commit()
    await db.refresh(course)
    return course

async def delete_course_service(c_id: int, db: AsyncSession):
    result = await db.execute(select(Courses).where(Courses.c_id == c_id))
    course = result.scalar_one_or_none()
    if not course: raise error("Course not found", 404)
    await db.delete(course)
    await db.commit()
    return True
