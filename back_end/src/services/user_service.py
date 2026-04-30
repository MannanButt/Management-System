import re
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from src.response import raise_exception
from src.models import Users, Students, Teachers, Courses, Fees, Enrollments, Examination, Attendance, ExamsStudents, Results
from src.schemas.user import UserRegistration
from src.auth import get_password_hash

error = raise_exception

def validate_strong_password(password: str, email: str):
    if not re.search(r"[A-Z]", password):
        raise error("Password must contain at least one uppercase letter", status_code=400)
    if not re.search(r"[a-z]", password):
        raise error("Password must contain at least one lowercase letter", status_code=400)
    if not re.search(r"\d", password):
        raise error("Password must contain at least one number", status_code=400)
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise error("Password must contain at least one special character", status_code=400)
    
    email_prefix = email.split("@")[0].lower()
    if len(email_prefix) > 3 and email_prefix in password.lower():
        raise error("Password cannot contain your email prefix for security", status_code=400)

def merge_user_profile(user: Users, profile: Any) -> dict:
    data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_id = getattr(profile, 's_id', getattr(profile, 't_id', None))
    data.update({"email": user.email, "role": user.role, "profile_id": profile_id})
    return data

async def create_user_service(user_data: UserRegistration, db: AsyncSession):
    if not user_data.password: raise error("Password is required")
    if user_data.role_option not in [0, 1]: raise error("Invalid role_option. Use 0 for student or 1 for teacher.")
    
    validate_strong_password(user_data.password, user_data.email)
    role = "student" if user_data.role_option == 0 else "teacher"
    
    existing_user = await db.execute(select(Users).where(Users.email.ilike(user_data.email)))
    if existing_user.scalar_one_or_none(): raise error("User with this email already exists", status_code=400)

    try:
        hashed_password = get_password_hash(user_data.password)
        db_user = Users(email=user_data.email, password=hashed_password, role=role)
        db.add(db_user)
        await db.flush()
        
        if user_data.role_option == 0:
            if not user_data.student_payload: raise error("student_payload is required when role_option is 0")
            db_profile = Students(**user_data.student_payload.model_dump(), u_id=db_user.u_id)
        else:
            if not user_data.teacher_payload: raise error("teacher_payload is required when role_option is 1")
            db_profile = Teachers(**user_data.teacher_payload.model_dump(), u_id=db_user.u_id)

        db.add(db_profile)
        await db.commit()
        await db.refresh(db_user)
        await db.refresh(db_profile)
    except IntegrityError as ie:
        await db.rollback()
        error_msg = str(ie.orig)
        message = "Database conflict: duplicate entry found"
        if "users_email_key" in error_msg: message = "Email already registered"
        elif "students_roll_no_key" in error_msg: message = "Roll Number already exists"
        elif "teachers_employee_code_key" in error_msg: message = "Employee Code already exists"
        raise error(message)
    
    return merge_user_profile(db_user, db_profile)

async def read_users_service(role_option: Optional[int], skip: int, limit: int, db: AsyncSession, search: Optional[str] = None, teacher_u_id: Optional[int] = None):
    if role_option is not None and role_option not in [0, 1, 2]: raise error("Invalid role_option.")
    
    # When a specific role is selected, we can paginate directly in the DB query.
    # When role_option is None (All Users), we must gather ALL matching rows first,
    # then count total and slice the correct page in Python, because applying
    # offset/limit to each role query independently gives wrong results.
    
    all_results = []
    
    if role_option == 0 or role_option is None:
        query = select(Users, Students).join(Students, Users.u_id == Students.u_id).where(Users.role == 'student')
        if teacher_u_id:
            t_res = await db.execute(select(Teachers).where(Teachers.u_id == teacher_u_id))
            teacher = t_res.scalar_one_or_none()
            if teacher:
                query = query.join(Enrollments, Students.s_id == Enrollments.s_id).join(Courses, Enrollments.c_id == Courses.c_id).where(Courses.t_id == teacher.t_id)
            else:
                query = query.where(Users.u_id == -1)

        if search:
            query = query.where((Students.name.ilike(f"%{search}%")) | (Users.email.ilike(f"%{search}%")) | (Students.roll_no.ilike(f"%{search}%")))
        
        # When a specific role is selected, paginate at DB level
        if role_option == 0:
            count_query = select(func.count()).select_from(query.subquery())
            count_res = await db.execute(count_query)
            total_count = count_res.scalar_one()
            results = await db.execute(query.offset(skip).limit(limit))
            return [merge_user_profile(u, s) for u, s in results.all()], total_count
        
        # For "All Users", fetch all matching students (no offset/limit yet)
        results = await db.execute(query)
        all_results.extend([merge_user_profile(u, s) for u, s in results.all()])
            
    if role_option == 1 or role_option is None:
        query = select(Users, Teachers).join(Teachers, Users.u_id == Teachers.u_id).where(Users.role == 'teacher')
        if search:
            query = query.where((Teachers.name.ilike(f"%{search}%")) | (Users.email.ilike(f"%{search}%")) | (Teachers.employee_code.ilike(f"%{search}%")))
        
        if role_option == 1:
            count_query = select(func.count()).select_from(query.subquery())
            count_res = await db.execute(count_query)
            total_count = count_res.scalar_one()
            results = await db.execute(query.offset(skip).limit(limit))
            return [merge_user_profile(u, t) for u, t in results.all()], total_count
        
        results = await db.execute(query)
        all_results.extend([merge_user_profile(u, t) for u, t in results.all()])
 
    if role_option == 2 or role_option is None:
        query = select(Users).where(Users.role == 'admin')
        if search: query = query.where(Users.email.ilike(f"%{search}%"))
        
        if role_option == 2:
            count_query = select(func.count()).select_from(query.subquery())
            count_res = await db.execute(count_query)
            total_count = count_res.scalar_one()
            results = await db.execute(query.offset(skip).limit(limit))
            return [{"u_id": u.u_id, "email": u.email, "role": u.role, "created_at": u.created_at} for u in results.scalars().all()], total_count
        
        results = await db.execute(query)
        all_results.extend([{"u_id": u.u_id, "email": u.email, "role": u.role, "created_at": u.created_at} for u in results.scalars().all()])
    
    # "All Users" mode: total is length of combined results, then slice for the page
    total_count = len(all_results)
    paged_results = all_results[skip : skip + limit]
    return paged_results, total_count

async def read_user_by_id_service(u_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.u_id == u_id))
    user = result.scalar_one_or_none()
    if not user: raise error("User not found", 404)
    
    if user.role == "student":
        p_res = await db.execute(select(Students).where(Students.u_id == u_id))
        profile = p_res.scalar_one_or_none()
    elif user.role == "teacher":
        p_res = await db.execute(select(Teachers).where(Teachers.u_id == u_id))
        profile = p_res.scalar_one_or_none()
    else:
        profile = None
        
    return merge_user_profile(user, profile) if profile else {"email": user.email, "role": user.role, "u_id": user.u_id}

async def update_user_service(u_id: int, data: dict, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.u_id == u_id))
    user = result.scalar_one_or_none()
    if not user: raise error("User not found", 404)
    
    if data.get("email"): user.email = data["email"]
    if data.get("role"): user.role = data["role"]
    if data.get("password"): user.password = get_password_hash(data["password"])
        
    if data.get("name") or data.get("contact_no"):
        if user.role == "student":
            p_res = await db.execute(select(Students).where(Students.u_id == u_id))
            profile = p_res.scalar_one_or_none()
        elif user.role == "teacher":
            p_res = await db.execute(select(Teachers).where(Teachers.u_id == u_id))
            profile = p_res.scalar_one_or_none()
        else: profile = None
            
        if profile:
            if data.get("name"): profile.name = data["name"]
            if data.get("contact_no"): profile.contact_no = data["contact_no"]
            
    await db.commit()
    return user

async def delete_user_service(u_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.u_id == u_id))
    user = result.scalar_one_or_none()
    if not user: raise error("User not found", 404)
    await db.delete(user)
    await db.commit()
    return True

async def get_dashboard_stats_service(db: AsyncSession, user_id: int, role: str):
    # Base queries for counts
    q_users = select(func.count(Users.u_id))
    q_courses = select(func.count(Courses.c_id))
    q_fees = select(func.count(Fees.f_id))
    q_enrollments = select(func.count(Enrollments.e_id))
    q_exams = select(func.count(Examination.ex_id))
    q_attendance = select(func.count(Attendance.a_id))
    q_results = select(func.count(Results.r_id))
    q_exam_students = select(func.count(ExamsStudents.es_id))

    if role == "teacher":
        t_result = await db.execute(select(Teachers).where(Teachers.u_id == user_id))
        teacher = t_result.scalar_one_or_none()
        if not teacher:
            return {k: 0 for k in ["users", "courses", "fees", "enrollments", "exams", "attendance", "results", "examStudents"]}
        
        tid = teacher.t_id
        q_courses = q_courses.where(Courses.t_id == tid)
        q_enrollments = q_enrollments.join(Courses, Enrollments.c_id == Courses.c_id).where(Courses.t_id == tid)
        q_exams = q_exams.join(Courses, Examination.c_id == Courses.c_id).where(Courses.t_id == tid)
        q_results = q_results.join(ExamsStudents).join(Examination).join(Courses).where(Courses.t_id == tid)
        q_exam_students = q_exam_students.join(Examination).join(Courses).where(Courses.t_id == tid)
        q_fees = q_fees.join(Enrollments, Fees.s_id == Enrollments.s_id).join(Courses, Enrollments.c_id == Courses.c_id).where(Courses.t_id == tid)
        # For teachers, we usually only care about students in their courses for attendance/users, 
        # but for now we'll keep the counts as requested.

    # Combine into a single efficient query using scalar subqueries
    final_query = select(
        q_users.scalar_subquery().label("users"),
        q_courses.scalar_subquery().label("courses"),
        q_fees.scalar_subquery().label("fees"),
        q_enrollments.scalar_subquery().label("enrollments"),
        q_exams.scalar_subquery().label("exams"),
        q_attendance.scalar_subquery().label("attendance"),
        q_results.scalar_subquery().label("results"),
        q_exam_students.scalar_subquery().label("examStudents")
    )

    result = await db.execute(final_query)
    row = result.first()
    
    return {
        "users": row.users,
        "courses": row.courses,
        "fees": row.fees,
        "enrollments": row.enrollments,
        "exams": row.exams,
        "attendance": row.attendance,
        "results": row.results,
        "examStudents": row.examStudents
    }
