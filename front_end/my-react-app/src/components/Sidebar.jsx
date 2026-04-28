import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, DollarSign,
  ClipboardList, FileText, CalendarCheck, Award,
  GraduationCap, LogOut, School
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
];
const adminItems = [
  { label: 'Users', icon: Users, to: '/users', roles: ['admin'] },
  { label: 'Courses', icon: BookOpen, to: '/courses', roles: ['admin', 'teacher', 'student'] },
  { label: 'Fees', icon: DollarSign, to: '/fees', roles: ['admin', 'student'] },
  { label: 'Enrollments', icon: ClipboardList, to: '/enrollments', roles: ['admin', 'student'] },
  { label: 'Exams', icon: FileText, to: '/examinations', roles: ['admin', 'teacher'] },
  { label: 'Attendance', icon: CalendarCheck, to: '/attendance', roles: ['admin', 'teacher', 'student'] },
  { label: 'Exam Registrations', icon: GraduationCap, to: '/exams-students', roles: ['admin', 'teacher'] },
  { label: 'Results', icon: Award, to: '/results', roles: ['admin', 'teacher', 'student'] },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmLogout = () => {
    logout();
    setShowConfirm(false);
    navigate('/login');
  };

  const filteredManagementItems = adminItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <School size={20} color="#fff" />
        </div>
        <span className="sidebar-logo-text">Student Management</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Main</div>
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Management</div>
        {filteredManagementItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ padding: '10px 12px', marginBottom: '8px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Logged in as</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
          <span className={`badge badge-${user?.role === 'admin' ? 'purple' : 'cyan'}`} style={{ marginTop: '6px' }}>{user?.role}</span>
        </div>
        <button className="sidebar-nav-item btn-danger" style={{ width: '100%', background: 'rgba(239,68,68,0.08)' }} onClick={() => setShowConfirm(true)}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {showConfirm && (
        <Modal 
          title="Confirm Logout" 
          onClose={() => setShowConfirm(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmLogout}>Logout</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </p>
        </Modal>
      )}
    </aside>
  );
}
