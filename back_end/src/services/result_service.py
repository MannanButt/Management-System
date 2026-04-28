from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Results

error = raise_exception

async def update_result_service(r_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(Results).where(Results.r_id == r_id))
    res = result.scalar_one_or_none()
    if not res: raise error("Result not found", 404)
    for k, v in data.items():
        if v is not None: setattr(res, k, v)
    await db.commit()
    await db.refresh(res)
    return res

async def delete_result_service(r_id: int, db: AsyncSession):
    result = await db.execute(select(Results).where(Results.r_id == r_id))
    res = result.scalar_one_or_none()
    if not res: raise error("Result not found", 404)
    await db.delete(res)
    await db.commit()
    return True
