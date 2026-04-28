import datetime
from sqlalchemy import CheckConstraint, Date, ForeignKeyConstraint, Integer, PrimaryKeyConstraint, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
 from src.models.enrollments import Enrollments

class Attendance(Base):
    __tablename__ = 'attendance'
    __table_args__ = (
        CheckConstraint("status::text = ANY (ARRAY['Present'::character varying, 'Absent'::character varying, 'Late'::character varying]::text[])", name='attendance_status_check'),
        ForeignKeyConstraint(['e_id'], ['enrollments.e_id'], ondelete='CASCADE', name='attendance_e_id_fkey'),
        PrimaryKeyConstraint('a_id', name='attendance_pkey'),
        UniqueConstraint('e_id', 'attendance_date', name='unique_attendance')
    )

    a_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    e_id: Mapped[int] = mapped_column(Integer, nullable=False)
    attendance_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(10), nullable=False)

    e: Mapped['Enrollments'] = relationship('Enrollments', back_populates='attendance')
