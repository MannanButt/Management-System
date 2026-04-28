from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.response import raise_exception
from src.models import Fees

error = raise_exception

async def delete_fee_service(f_id: int, db: AsyncSession):
    result = await db.execute(select(Fees).where(Fees.f_id == f_id))
    fee = result.scalar_one_or_none()
    if not fee: raise error("Fee record not found", 404)
    await db.delete(fee)
    await db.commit()
    return True
