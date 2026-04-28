import secrets
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.response import raise_exception
from src.models import Users, Students, Teachers, OTPRecords
from src.auth import verify_password, create_access_token, SECRET_KEY, ALGORITHM
from src.core.config import settings, logger
from jose import jwt, JWTError

from .user_service import merge_user_profile

error = raise_exception

def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))

def send_email_helper(email_to: str, otp: str):
    logger.info(f"--- [TESTING] OTP for {email_to} is: {otp} ---")
    
    mail_server = settings.MAIL_SERVER
    mail_port = settings.MAIL_PORT
    mail_username = settings.MAIL_USERNAME
    mail_password = settings.MAIL_PASSWORD
    mail_from = settings.MAIL_FROM

    if not all([mail_server, mail_username, mail_password]):
        logger.warning(f"SMTP credentials not set. OTP for {email_to} is: {otp}")
        return

    subject = "Your LexiMind AI OTP Code"
    body = f"Hello,\n\nYour OTP code for password reset is: {otp}\n\nThis code will expire in 2 minutes.\n\nRegards,\nLexiMind AI Team"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = email_to

    try:
        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_username, mail_password)
            server.send_message(msg)
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")

async def login_user_service(email: str, password: str, db: AsyncSession):
    query = select(Users, Students, Teachers) \
        .outerjoin(Students, Users.u_id == Students.u_id) \
        .outerjoin(Teachers, Users.u_id == Teachers.u_id) \
        .where(Users.email.ilike(email))
    
    result = await db.execute(query)
    row = result.first()
    
    if not row: raise error("User not found", status_code=404)

    db_user, db_student, db_teacher = row

    if not verify_password(password, db_user.password): raise error("Wrong password", status_code=401)

    profile = db_student if db_user.role == "student" else db_teacher if db_user.role == "teacher" else None
    user_data = merge_user_profile(db_user, profile) if profile else {"email": db_user.email, "role": db_user.role, "u_id": db_user.u_id}

    payload = {
        "sub": db_user.email,
        "role": db_user.role,
        "name": user_data.get("name") or ("Administrator" if db_user.role == "admin" else "User"),
        "profile_id": user_data.get("t_id") if db_user.role == "teacher" else user_data.get("s_id") if db_user.role == "student" else None
    }
    access_token = create_access_token(data=payload)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": user_data
    }

async def send_otp_service(email: str, db: AsyncSession):
    query = select(Users).where(Users.email.ilike(email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user: raise error("Email not found", status_code=404)
        
    otp = generate_otp()
    logger.info(f"Generated new OTP for {email}: {otp}")
    expiry = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=2)
    
    await db.execute(
        update(OTPRecords).where(OTPRecords.u_id == user.u_id, OTPRecords.is_used == 0).values(is_used=1)
    )
    
    otp_entry = OTPRecords(u_id=user.u_id, otp=otp, expires_at=expiry, purpose="password_reset")
    db.add(otp_entry)
    await db.commit()
    return otp

async def verify_otp_service(email: str, otp: str, db: AsyncSession):
    query = select(Users).where(Users.email.ilike(email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user: raise error("Email not found", status_code=404)
        
    otp_query = select(OTPRecords).where(
        OTPRecords.u_id == user.u_id, OTPRecords.otp == otp, OTPRecords.purpose == "password_reset", OTPRecords.is_used == 0
    ).order_by(OTPRecords.created_at.desc())
    
    otp_result = await db.execute(otp_query)
    otp_entry = otp_result.scalar_one_or_none()
    if not otp_entry: raise error("Invalid OTP", status_code=400)
    
    if otp_entry.expires_at < datetime.now(timezone.utc).replace(tzinfo=None): raise error("OTP has expired", status_code=400)
        
    otp_entry.is_used = 1
    await db.commit()

    reset_token = create_access_token(data={"sub": user.email, "scope": "password_reset"}, expires_delta=timedelta(minutes=5))
    return {"reset_token": reset_token}

async def reset_password_service(token: str, new_password: str, db: AsyncSession):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset": raise error("Invalid token scope", status_code=400)
        email = payload.get("sub")
    except JWTError:
        raise error("Invalid or expired reset token", status_code=400)

    from src.auth import get_password_hash
    query = select(Users).where(Users.email.ilike(email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user: raise error("User not found", status_code=404)
        
    user.password = get_password_hash(new_password)
    await db.commit()
    return True
