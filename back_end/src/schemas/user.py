from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Union
from datetime import datetime
from .student import StudentBase, StudentResponse
from .teacher import TeacherBase, TeacherResponse

class UserBase(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(student|teacher|admin)$")

class UserResponse(UserBase):
    u_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    contact_no: Optional[str] = None

class UserRegistration(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=20)
    role_option: int # 0 for student, 1 for teacher
    student_payload: Optional[StudentBase] = None
    teacher_payload: Optional[TeacherBase] = None

class StudentRegistrationResponse(StudentResponse):
    email: EmailStr
    role: str

class TeacherRegistrationResponse(TeacherResponse):
    email: EmailStr
    role: str

UserRegistrationResponse = Union[StudentRegistrationResponse, TeacherRegistrationResponse]
