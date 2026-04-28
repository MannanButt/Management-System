import datetime
from typing import Optional
from sqlalchemy import CheckConstraint, Date, ForeignKeyConstraint, Integer, PrimaryKeyConstraint, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
 from src.models.courses import Courses
 from src.models.students import Students
 from src.models.results import Results

class Examination(Base):
    __tablename__ = 'examination'
    __table_args__ = (
        ForeignKeyConstraint(['c_id'], ['courses.c_id'], ondelete='CASCADE', name='examination_c_id_fkey'),
        PrimaryKeyConstraint('ex_id', name='examination_pkey')
    )

    ex_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    c_id: Mapped[int] = mapped_column(Integer, nullable=False)
    exam_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'upcoming'")) # upcoming, ongoing, completed

    c: Mapped['Courses'] = relationship('Courses', back_populates='examination')
    exams_students: Mapped[list['ExamsStudents']] = relationship('ExamsStudents', back_populates='ex')

class ExamsStudents(Base):
    __tablename__ = 'exams_students'
    __table_args__ = (
        CheckConstraint("status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying]::text[])", name='exams_students_status_check'),
        CheckConstraint("student_status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying]::text[])", name='exams_students_student_status_check'),
        ForeignKeyConstraint(['ex_id'], ['examination.ex_id'], ondelete='CASCADE', name='exams_students_ex_id_fkey'),
        ForeignKeyConstraint(['s_id'], ['students.s_id'], ondelete='CASCADE', name='exams_students_s_id_fkey'),
        PrimaryKeyConstraint('es_id', name='exams_students_pkey'),
        UniqueConstraint('ex_id', 's_id', name='unique_ex_s')
    )

    es_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ex_id: Mapped[int] = mapped_column(Integer, nullable=False)
    s_id: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(50), server_default=text("'pending'::character varying"))
    student_status: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'absent'::character varying"))

    ex: Mapped['Examination'] = relationship('Examination', back_populates='exams_students')
    s: Mapped['Students'] = relationship('Students', back_populates='exams_students')
    results: Mapped[list['Results']] = relationship('Results', back_populates='es')
