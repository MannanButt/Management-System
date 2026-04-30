from typing import Optional
from sqlalchemy import ForeignKeyConstraint, Index, Integer, PrimaryKeyConstraint, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
 from src.models.users import Users
 from src.models.courses import Courses
class Teachers(Base):
    __tablename__ = 'teachers'
    __table_args__ = (
        ForeignKeyConstraint(['u_id'], ['users.u_id'], ondelete='CASCADE', name='teachers_u_id_fkey'),
        PrimaryKeyConstraint('t_id', name='teachers_pkey'),
        UniqueConstraint('employee_code', name='teachers_employee_code_key'),
        UniqueConstraint('u_id', name='teachers_u_id_key'),
        Index('idx_teachers_name', 'name')
    )

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    u_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(150))
    qualification: Mapped[Optional[str]] = mapped_column(String(100))
    contact_no: Mapped[Optional[str]] = mapped_column(String(20))

    u: Mapped['Users'] = relationship('Users', back_populates='teachers')
    courses: Mapped[list['Courses']] = relationship('Courses', back_populates='t')
