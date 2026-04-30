from fastapi import APIRouter, Depends, status
from typing import Optional
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from src.database import get_db
from src.models import Results, ExamsStudents, Teachers, Courses, Examination, Students, Users
from src.schemas.result import ResultCreate, ResultUpdate
from src.auth import get_current_user, check_admin_or_teacher_role
from src.response import success_response, raise_exception
from src.services import result_service as utils

router = APIRouter(tags=["Results"])
response = success_response
CustomException = raise_exception

@router.post("/results/", status_code=status.HTTP_201_CREATED)
async def create_result(result: ResultCreate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    existing = await db.execute(select(Results).where(Results.es_id == result.es_id))
    if existing.scalar_one_or_none():
        raise CustomException("Result already recorded for this exam registration", status_code=400)
    db_result = Results(**result.model_dump())
    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)
    return response(data=db_result, message="Result recorded successfully")

@router.get("/results/")
async def read_results(
    skip: int = 0, limit: int = 5, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), current_user: Users = Depends(get_current_user)
):
    query = select(Results).options(joinedload(Results.es).joinedload(ExamsStudents.s))
    if current_user.role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == current_user.u_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return response(data=[], message="Teacher profile not found")
        query = (query
                 .join(ExamsStudents, Results.es_id == ExamsStudents.es_id)
                 .join(Examination, ExamsStudents.ex_id == Examination.ex_id)
                 .join(Courses, Examination.c_id == Courses.c_id)
                 .where(Courses.t_id == teacher.t_id))
    if search:
        query = (query
                 .join(ExamsStudents, Results.es_id == ExamsStudents.es_id, isouter=True)
                 .join(Students, ExamsStudents.s_id == Students.s_id, isouter=True)
                 .where(Students.name.ilike(f"%{search}%")))
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    rows = result.scalars().all()
    data = []
    for row in rows:
        item = jsonable_encoder(row)
        item["student_name"] = row.es.s.name if row.es and row.es.s else "Unknown"
        data.append(item)
    return response(data=data, total=total, message="Results retrieved successfully")

@router.patch("/results/{r_id}")
async def update_result(r_id: int, update: ResultUpdate, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    data = await utils.update_result_service(r_id, update.model_dump(), db)
    return response(data=data, message="Result updated successfully")

@router.delete("/results/{r_id}")
async def delete_result(r_id: int, db: AsyncSession = Depends(get_db), auth: Users = Depends(check_admin_or_teacher_role)):
    await utils.delete_result_service(r_id, db)
    return response(message="Result deleted successfully")
