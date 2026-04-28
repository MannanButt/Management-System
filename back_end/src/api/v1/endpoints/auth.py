from fastapi import APIRouter, Depends, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest, VerifyOTPRequest
from src.response import success_response, login_response
from src.services import auth_service as utils

router = APIRouter(tags=["Authentication"])
response = success_response

@router.post("/auth/login")
async def login(login_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    data = await utils.login_user_service(login_data.username, login_data.password, db)
    return login_response(data)

@router.post("/auth/forgot-password/send-otp")
async def forgot_password(bg_request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    otp = await utils.send_otp_service(bg_request.email, db)
    background_tasks.add_task(utils.send_email_helper, bg_request.email, otp)
    return response(message="OTP sent successfully to your email")

@router.post("/auth/forgot-password/verify-otp")
async def verify_otp(verify_request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    data = await utils.verify_otp_service(verify_request.email, verify_request.otp, db)
    return response(data=data, message="OTP verified successfully")

@router.post("/auth/forgot-password/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await utils.reset_password_service(req.token, req.new_password, db)
    return response(message="Password reset successfully")
