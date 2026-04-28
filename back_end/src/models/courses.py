import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, PrimaryKeyConstraint, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:

 from src.models.teachers import Teachers
 from src.models.enrollments import Enrollments
 from src.models.exams import Examination

class Courses(Base):
    __tablename__ = 'courses'
    __table_args__ = (
        ForeignKeyConstraint(['t_id'], ['teachers.t_id'], ondelete='RESTRICT', name='courses_t_id_fkey'),
        PrimaryKeyConstraint('c_id', name='courses_pkey')
    )

    c_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    t_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    title: Mapped[Optional[str]] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(Text)

    t: Mapped['Teachers'] = relationship('Teachers', back_populates='courses')
    enrollments: Mapped[list['Enrollments']] = relationship('Enrollments', back_populates='c')
    examination: Mapped[list['Examination']] = relationship('Examination', back_populates='c')
