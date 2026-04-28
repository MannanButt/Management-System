from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

class StudentBase(BaseModel):
    name: str
    roll_no: str
    class_name: str
    section: str
    date_of_birth: Optional[date] = None
    contact_no: Optional[str] = None

class StudentCreate(StudentBase):
    u_id: int = Field(..., ge=1)

class StudentResponse(StudentBase):
    s_id: int
    u_id: int
    model_config = ConfigDict(from_attributes=True)
