from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Attendance

error = raise_exception

async def update_attendance_service(a_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(Attendance).where(Attendance.a_id == a_id))
    attendance = result.scalar_one_or_none()
    if not attendance: raise error("Attendance record not found", 404)
    for k, v in data.items():
        if v is not None: setattr(attendance, k, v)
    await db.commit()
    await db.refresh(attendance)
    return attendance

async def delete_attendance_service(a_id: int, db: AsyncSession):
    result = await db.execute(select(Attendance).where(Attendance.a_id == a_id))
    attendance = result.scalar_one_or_none()
    if not attendance: raise error("Attendance record not found", 404)
    await db.delete(attendance)
    await db.commit()
    return True
