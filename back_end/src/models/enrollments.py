import datetime
from sqlalchemy import DateTime, ForeignKeyConstraint, Index, Integer, PrimaryKeyConstraint, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:

 from src.models.courses import Courses
 from src.models.students import Students
 from src.models.attendance import Attendance

class Enrollments(Base):
    __tablename__ = 'enrollments'
    __table_args__ = (
        ForeignKeyConstraint(['c_id'], ['courses.c_id'], ondelete='CASCADE', name='enrollments_c_id_fkey'),
        ForeignKeyConstraint(['s_id'], ['students.s_id'], ondelete='CASCADE', name='enrollments_s_id_fkey'),
        PrimaryKeyConstraint('e_id', name='enrollments_pkey'),
        UniqueConstraint('s_id', 'c_id', name='unique_enrollment'),
        Index('idx_enrollments_c_id', 'c_id'),
        Index('idx_enrollments_s_id', 's_id')
    )

    e_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    s_id: Mapped[int] = mapped_column(Integer, nullable=False)
    c_id: Mapped[int] = mapped_column(Integer, nullable=False)
    enrolled_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    c: Mapped['Courses'] = relationship('Courses', back_populates='enrollments')
    s: Mapped['Students'] = relationship('Students', back_populates='enrollments')
    attendance: Mapped[list['Attendance']] = relationship('Attendance', back_populates='e')
