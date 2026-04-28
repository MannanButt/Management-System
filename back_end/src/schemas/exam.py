from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

class ExaminationBase(BaseModel):
    c_id: int = Field(..., ge=1)
    exam_date: date
    title: str
    status: str = "upcoming"

class ExaminationCreate(ExaminationBase):
    pass

class ExaminationUpdate(BaseModel):
    title: Optional[str] = None
    c_id: Optional[int] = None
    exam_date: Optional[date] = None
    status: Optional[str] = None

class ExaminationResponse(ExaminationBase):
    ex_id: int
    model_config = ConfigDict(from_attributes=True)

class ExamsStudentBase(BaseModel):
    ex_id: int = Field(..., ge=1)
    s_id: int = Field(..., ge=1)
    status: Optional[str] = "pending"
    student_status: Optional[str] = "absent"

class ExamsStudentCreate(ExamsStudentBase):
    pass

class ExamsStudentEdit(BaseModel):
    ex_id: Optional[int] = None
    s_id: Optional[int] = None
    status: Optional[str] = None
    student_status: Optional[str] = None

class ExamsStudentUpdate(BaseModel):
    status: Optional[str] = None
    student_status: Optional[str] = None

class ExamsStudentResponse(ExamsStudentBase):
    es_id: int
    model_config = ConfigDict(from_attributes=True)
