from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class EnrollmentBase(BaseModel):
    s_id: int = Field(..., ge=1)
    c_id: int = Field(..., ge=1)

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentUpdate(BaseModel):
    s_id: Optional[int] = None
    c_id: Optional[int] = None

class EnrollmentResponse(EnrollmentBase):
    e_id: int
    enrolled_at: datetime
    model_config = ConfigDict(from_attributes=True)
