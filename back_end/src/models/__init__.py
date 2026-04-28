from .users import Users, OTPRecords
from .students import Students
from .teachers import Teachers
from .courses import Courses
from .fees import Fees
from .enrollments import Enrollments
from .exams import Examination, ExamsStudents
from .results import Results
from .attendance import Attendance

__all__ = [
    'Users', 'OTPRecords', 'Students', 'Teachers', 'Courses', 'Fees',
    'Enrollments', 'Examination', 'ExamsStudents', 'Results', 'Attendance'
]
