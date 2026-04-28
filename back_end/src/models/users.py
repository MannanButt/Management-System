import datetime
from sqlalchemy import CheckConstraint, DateTime, Integer, PrimaryKeyConstraint, String, UniqueConstraint, ForeignKeyConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from src.models.students import Students
    from src.models.teachers import Teachers


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        CheckConstraint("role::text = ANY (ARRAY['student'::character varying, 'teacher'::character varying, 'admin'::character varying]::text[])", name='users_role_check'),
        PrimaryKeyConstraint('u_id', name='users_pkey'),
        UniqueConstraint('email', name='users_email_key')
    )

    u_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    students: Mapped[list['Students']] = relationship('Students', back_populates='u')
    teachers: Mapped['Teachers'] = relationship('Teachers', uselist=False, back_populates='u')
    otp_records: Mapped[list['OTPRecords']] = relationship('OTPRecords', back_populates='user')

class OTPRecords(Base):
    __tablename__ = 'otp_records'
    __table_args__ = (
        ForeignKeyConstraint(['u_id'], ['users.u_id'], ondelete='CASCADE'),
        PrimaryKeyConstraint('id'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    u_id: Mapped[int] = mapped_column(Integer, nullable=False)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'password_reset'"))
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    is_used: Mapped[bool] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))

    user: Mapped['Users'] = relationship('Users', back_populates='otp_records')
