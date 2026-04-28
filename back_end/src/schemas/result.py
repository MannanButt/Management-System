from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from decimal import Decimal

class ResultBase(BaseModel):
    es_id: int = Field(..., ge=1)
    marks_obtained: Decimal = Field(..., ge=0)
    total_marks: Decimal = Field(..., ge=0)
    grade: Optional[str] = None

class ResultCreate(ResultBase):
    pass

class ResultUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    total_marks: Optional[float] = None
    grade: Optional[str] = None

class ResultResponse(ResultBase):
    r_id: int
    model_config = ConfigDict(from_attributes=True)
