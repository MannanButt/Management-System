from fastapi import APIRouter
from src.api.v1.endpoints import (
    auth, users, courses, fees, enrollments, 
    examinations, attendance, exams_students, 
    results, dashboard
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(courses.router)
api_router.include_router(fees.router)
api_router.include_router(enrollments.router)
api_router.include_router(examinations.router)
api_router.include_router(attendance.router)
api_router.include_router(exams_students.router)
api_router.include_router(results.router)
api_router.include_router(dashboard.router)
