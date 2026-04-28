from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class CourseBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class CourseCreate(CourseBase):
    t_id: int = Field(..., ge=1)

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    t_id: Optional[int] = None

class CourseResponse(CourseBase):
    c_id: int
    t_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
