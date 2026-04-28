from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.models import Users
from src.auth import get_current_user
from src.response import success_response
from src.services import user_service as utils

router = APIRouter(tags=["Dashboard"])
response = success_response

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)):
    data = await utils.get_dashboard_stats_service(db, current_user.u_id, current_user.role)
    return response(data=data, message="Dashboard stats retrieved successfully")
