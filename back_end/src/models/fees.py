import datetime
import decimal
from typing import Optional
from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKeyConstraint, Integer, Numeric, PrimaryKeyConstraint, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:

 from src.models.students import Students

class Fees(Base):
    __tablename__ = 'fees'
    __table_args__ = (
        CheckConstraint("status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying]::text[])", name='fees_status_check'),
        ForeignKeyConstraint(['s_id'], ['students.s_id'], ondelete='CASCADE', name='fees_s_id_fkey'),
        PrimaryKeyConstraint('f_id', name='fees_pkey')
    )

    f_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    s_id: Mapped[int] = mapped_column(Integer, nullable=False)
    admission_fee: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text('0'))
    tuition_fee: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text('0'))
    library_fee: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text('0'))
    other_fee: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default=text('0'))
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 2), nullable=False) # Total
    due_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'pending'::character varying"))
    paid_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)

    s: Mapped['Students'] = relationship('Students', back_populates='fees')
