from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Examination

error = raise_exception

async def delete_examination_service(ex_id: int, db: AsyncSession):
    result = await db.execute(select(Examination).where(Examination.ex_id == ex_id))
    examination = result.scalar_one_or_none()
    if not examination: raise error("Examination not found", 404)
    await db.delete(examination)
    await db.commit()
    return True
