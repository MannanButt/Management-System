import decimal
from typing import Optional
from sqlalchemy import ForeignKeyConstraint, Index, Integer, Numeric, PrimaryKeyConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
 from src.models.exams import ExamsStudents

class Results(Base):
    __tablename__ = 'results'
    __table_args__ = (
        ForeignKeyConstraint(['es_id'], ['exams_students.es_id'], ondelete='CASCADE', name='results_es_id_fkey'),
        PrimaryKeyConstraint('r_id', name='results_pkey'),
        Index('idx_results_exam_std', 'es_id')
    )

    r_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    es_id: Mapped[int] = mapped_column(Integer, nullable=False)
    marks_obtained: Mapped[decimal.Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    total_marks: Mapped[decimal.Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    grade: Mapped[Optional[str]] = mapped_column(String(5))

    es: Mapped['ExamsStudents'] = relationship('ExamsStudents', back_populates='results')
