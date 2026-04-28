import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s what\'s happening.' },
  '/users': { title: 'Users', subtitle: 'Manage student and teacher accounts.' },
  '/courses': { title: 'Courses', subtitle: 'Browse and create all available courses.' },
  '/fees': { title: 'Fees', subtitle: 'Track and manage student fee records.' },
  '/enrollments': { title: 'Enrollments', subtitle: 'Manage course enrollments for students.' },
  '/examinations': { title: 'Examinations', subtitle: 'Schedule and manage all examinations.' },
  '/attendance': { title: 'Attendance', subtitle: 'Track daily student attendance.' },
  '/exams-students': { title: 'Exam Registrations', subtitle: 'Register students for examinations.' },
  '/results': { title: 'Results', subtitle: 'View and record student exam results.' },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = pageTitles[pathname] || { title: 'Student Management System', subtitle: '' };
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'LX';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">{meta.title}</span>
        <span className="navbar-subtitle">{meta.subtitle}</span>
      </div>
      <div className="navbar-right">
        <button className="btn btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '50%' }}>
          <Bell size={16} />
        </button>
        <div className="navbar-avatar" title={user?.email}>{initials}</div>
      </div>
    </nav>
  );
}
