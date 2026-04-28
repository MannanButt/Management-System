from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

class AttendanceBase(BaseModel):
    e_id: int = Field(..., ge=1)
    attendance_date: date
    status: str = Field(pattern="^(Present|Absent|Late)$")

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    e_id: Optional[int] = None
    attendance_date: Optional[str] = None
    status: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    a_id: int
    model_config = ConfigDict(from_attributes=True)
