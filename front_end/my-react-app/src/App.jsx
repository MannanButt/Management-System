import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Courses from './pages/Courses';
import Fees from './pages/Fees';
import Enrollments from './pages/Enrollments';
import Examinations from './pages/Examinations';
import Attendance from './pages/Attendance';
import ExamsStudents from './pages/ExamsStudents';
import Results from './pages/Results';
import EditUser from './pages/EditUser';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout><Users /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/users/edit/:id" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout><EditUser /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'student']}>
              <AppLayout><Courses /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fees" element={
            <ProtectedRoute requiredRoles={['admin', 'student']}>
              <AppLayout><Fees /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/enrollments" element={
            <ProtectedRoute requiredRoles={['admin', 'student']}>
              <AppLayout><Enrollments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/examinations" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <AppLayout><Examinations /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'student']}>
              <AppLayout><Attendance /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/exams-students" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher']}>
              <AppLayout><ExamsStudents /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute requiredRoles={['admin', 'teacher', 'student']}>
              <AppLayout><Results /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
