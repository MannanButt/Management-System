import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

// Inject JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- AUTH ---
export const loginUser = (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);
  
  return api.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
};
export const registerUser = (data) => api.post('/users', data);
export const sendOTP = (email) => api.post('/auth/forgot-password/send-otp', { email });
export const verifyOTP = (email, otp) => api.post('/auth/forgot-password/verify-otp', { email, otp });
export const resetPassword = (token, new_password) => api.post('/auth/forgot-password/reset-password', { token, new_password });
export const getDashboardStats = () => api.get('/dashboard/stats');

// --- USERS ---
export const getUsers = (role_option, search, skip = 0, limit = 10) => api.get('/users/', { params: { role_option, search, skip, limit } });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// --- COURSES ---
export const getCourses = (search, skip = 0, limit = 10) => api.get('/courses/', { params: { search, skip, limit } });
export const createCourse = (data) => api.post('/courses/', data);
export const updateCourse = (id, data) => api.patch(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// --- FEES ---
export const getFees = (search, skip = 0, limit = 10) => api.get('/fees/', { params: { search, skip, limit } });
export const createFee = (data) => api.post('/fees/', data);
export const updateFeeStatus = (id, status) => api.patch(`/fees/${id}/status`, { status });
export const deleteFee = (id) => api.delete(`/fees/${id}`);

// --- ENROLLMENTS ---
export const getEnrollments = (search, skip = 0, limit = 10) => api.get('/enrollments/', { params: { search, skip, limit } });
export const createEnrollment = (data) => api.post('/enrollments/', data);
export const updateEnrollment = (id, data) => api.patch(`/enrollments/${id}`, data);
export const deleteEnrollment = (id) => api.delete(`/enrollments/${id}`);

// --- EXAMINATIONS ---
export const getExaminations = (search, skip = 0, limit = 10) => api.get('/examinations/', { params: { search, skip, limit } });
export const getAvailableCoursesForExams = () => api.get('/examinations/available-courses');
export const createExamination = (data) => api.post('/examinations/', data);
export const updateExamination = (id, data) => api.patch(`/examinations/${id}/status`, data);
export const deleteExamination = (id) => api.delete(`/examinations/${id}`);

// --- ATTENDANCE ---
export const getAttendance = (search, skip = 0, limit = 10) => api.get('/attendance/', { params: { search, skip, limit } });
export const getAvailableStudentsForAttendance = () => api.get('/attendance/available-students');
export const createAttendance = (data) => api.post('/attendance/', data);
export const updateAttendance = (id, data) => api.patch(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

// --- EXAMS STUDENTS ---
export const getExamsStudents = (search, skip = 0, limit = 10) => api.get('/exams-students/', { params: { search, skip, limit } });
export const createExamsStudent = (data) => api.post('/exams-students/', data);
export const updateExamsStudentStatus = (id, data) => api.patch(`/exams-students/${id}/status`, data);
export const editExamsStudent = (id, data) => api.patch(`/exams-students/${id}/edit`, data);
export const deleteExamsStudent = (id) => api.delete(`/exams-students/${id}`);

// --- RESULTS ---
export const getResults = (search, skip = 0, limit = 10) => api.get('/results/', { params: { search, skip, limit } });
export const createResult = (data) => api.post('/results/', data);
export const updateResult = (id, data) => api.patch(`/results/${id}`, data);
export const deleteResult = (id) => api.delete(`/results/${id}`);

export default api;
