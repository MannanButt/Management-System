from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class TeacherBase(BaseModel):
    name: str
    employee_code: str
    department: Optional[str] = None
    qualification: Optional[str] = None
    contact_no: Optional[str] = None

class TeacherCreate(TeacherBase):
    u_id: int = Field(..., ge=1)

class TeacherResponse(TeacherBase):
    t_id: int
    u_id: int
    model_config = ConfigDict(from_attributes=True)
