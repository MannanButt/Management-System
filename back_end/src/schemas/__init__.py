from .user import (
    UserBase, UserResponse, UserUpdate, UserRegistration,
    StudentRegistrationResponse, TeacherRegistrationResponse, UserRegistrationResponse
)
from .auth import LoginRequest, ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
from .student import StudentBase, StudentCreate, StudentResponse
from .teacher import TeacherBase, TeacherCreate, TeacherResponse
from .course import CourseBase, CourseCreate, CourseUpdate, CourseResponse
from .fee import FeeBase, FeeCreate, FeeUpdate, FeeResponse
from .enrollment import EnrollmentBase, EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from .exam import (
    ExaminationBase, ExaminationCreate, ExaminationUpdate, ExaminationResponse,
    ExamsStudentBase, ExamsStudentCreate, ExamsStudentEdit, ExamsStudentUpdate, ExamsStudentResponse
)
from .attendance import AttendanceBase, AttendanceCreate, AttendanceUpdate, AttendanceResponse
from .result import ResultBase, ResultCreate, ResultUpdate, ResultResponse

__all__ = [
    'UserBase', 'UserResponse', 'UserUpdate', 'UserRegistration',
    'StudentRegistrationResponse', 'TeacherRegistrationResponse', 'UserRegistrationResponse',
    'LoginRequest', 'ForgotPasswordRequest', 'VerifyOTPRequest', 'ResetPasswordRequest',
    'StudentBase', 'StudentCreate', 'StudentResponse',
    'TeacherBase', 'TeacherCreate', 'TeacherResponse',
    'CourseBase', 'CourseCreate', 'CourseUpdate', 'CourseResponse',
    'FeeBase', 'FeeCreate', 'FeeUpdate', 'FeeResponse',
    'EnrollmentBase', 'EnrollmentCreate', 'EnrollmentUpdate', 'EnrollmentResponse',
    'ExaminationBase', 'ExaminationCreate', 'ExaminationUpdate', 'ExaminationResponse',
    'ExamsStudentBase', 'ExamsStudentCreate', 'ExamsStudentEdit', 'ExamsStudentUpdate', 'ExamsStudentResponse',
    'AttendanceBase', 'AttendanceCreate', 'AttendanceUpdate', 'AttendanceResponse',
    'ResultBase', 'ResultCreate', 'ResultUpdate', 'ResultResponse'
]
