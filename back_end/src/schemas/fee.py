from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class FeeBase(BaseModel):
    s_id: int = Field(..., ge=1)
    admission_fee: Decimal = Field(default=0, ge=0)
    tuition_fee: Decimal = Field(default=0, ge=0)
    library_fee: Decimal = Field(default=0, ge=0)
    other_fee: Decimal = Field(default=0, ge=0)
    amount: Decimal = Field(..., ge=0)
    due_date: date
    status: Optional[str] = "pending"

class FeeCreate(FeeBase):
    pass

class FeeUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None

class FeeResponse(FeeBase):
    f_id: int
    paid_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
