import datetime
from typing import Optional
from sqlalchemy import Date, ForeignKeyConstraint, Index, Integer, PrimaryKeyConstraint, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.models.users import Users
    from src.models.fees import Fees
    from src.models.enrollments import Enrollments
    from src.models.exams import ExamsStudents

class Students(Base):
    __tablename__ = 'students'
    __table_args__ = (
        ForeignKeyConstraint(['u_id'], ['users.u_id'], ondelete='CASCADE', name='students_u_id_fkey'),
        PrimaryKeyConstraint('s_id', name='students_pkey'),
        UniqueConstraint('roll_no', name='students_roll_no_key'),
        Index('idx_students_u_id', 'u_id'),
        Index('idx_students_name', 'name'),
        Index('idx_students_class_section', 'class_name', 'section')
    )

    s_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    u_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    roll_no: Mapped[str] = mapped_column(String(50), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    section: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[Optional[datetime.date]] = mapped_column(Date)
    contact_no: Mapped[Optional[str]] = mapped_column(String(20))

    u: Mapped['Users'] = relationship('Users', back_populates='students')
    fees: Mapped[list['Fees']] = relationship('Fees', back_populates='s')
    enrollments: Mapped[list['Enrollments']] = relationship('Enrollments', back_populates='s')
    exams_students: Mapped[list['ExamsStudents']] = relationship('ExamsStudents', back_populates='s')
