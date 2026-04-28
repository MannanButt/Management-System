import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, DollarSign, ClipboardList, FileText, CalendarCheck, GraduationCap, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { getDashboardStats } from '../api/apiService';

const quickLinks = [
  { label: 'Users', desc: 'Manage accounts', icon: Users, to: '/users', color: 'purple', roles: ['admin'] },
  { label: 'Courses', desc: 'Browse courses', icon: BookOpen, to: '/courses', color: 'cyan', roles: ['admin', 'teacher', 'student'] },
  { label: 'Fees', desc: 'Track payments', icon: DollarSign, to: '/fees', color: 'warning', roles: ['admin', 'student'] },
  { label: 'Enrollments', desc: 'Student-course links', icon: ClipboardList, to: '/enrollments', color: 'success', roles: ['admin', 'student'] },
  { label: 'Examinations', desc: 'Schedule exams', icon: FileText, to: '/examinations', color: 'purple', roles: ['admin', 'teacher'] },
  { label: 'Attendance', desc: 'Daily tracking', icon: CalendarCheck, to: '/attendance', color: 'cyan', roles: ['admin', 'teacher', 'student'] },
  { label: 'Exam Registrations', desc: 'Register students', icon: GraduationCap, to: '/exams-students', color: 'warning', roles: ['admin', 'teacher'] },
  { label: 'Results', desc: 'Grades & marks', icon: Award, to: '/results', color: 'success', roles: ['admin', 'teacher', 'student'] },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const filteredLinks = quickLinks.filter(link => link.roles.includes(user?.role));

  return (
    <div>
      <div style={{ marginBottom: '32px' }} className="animate-fade-up">
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          Hey {user?.name || 'User'}! 👋
        </h1>
        <p>Here's an overview of your institution at a glance.</p>
      </div>

      <div className="stats-grid">
        {user?.role === 'admin' && <StatCard icon={Users} label="Total Users" value={loading ? '…' : stats.users} color="purple" delay={0} />}
        <StatCard icon={BookOpen} label="Courses" value={loading ? '…' : stats.courses} color="cyan" delay={50} />
        {(user?.role === 'admin' || user?.role === 'student') && <StatCard icon={DollarSign} label="Fee Records" value={loading ? '…' : stats.fees} color="warning" delay={100} />}
        {(user?.role === 'admin' || user?.role === 'student') && <StatCard icon={ClipboardList} label="Enrollments" value={loading ? '…' : stats.enrollments} color="success" delay={150} />}
        {(user?.role === 'admin' || user?.role === 'teacher') && <StatCard icon={FileText} label="Examinations" value={loading ? '…' : stats.exams} color="purple" delay={200} />}
        <StatCard icon={CalendarCheck} label="Attendance" value={loading ? '…' : stats.attendance} color="cyan" delay={250} />
        {(user?.role === 'admin' || user?.role === 'teacher') && <StatCard icon={GraduationCap} label="Exam Registrations" value={loading ? '…' : stats.examStudents} color="warning" delay={300} />}
        <StatCard icon={Award} label="Results" value={loading ? '…' : stats.results} color="success" delay={350} />
      </div>

      <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', marginTop: '40px' }} className="animate-fade-up-2">Quick Access</h2>
      <div className="quick-access-grid">
        {filteredLinks.map(({ label, desc, icon: Icon, to, color }, i) => (
          <button key={to} onClick={() => navigate(to)}
            className={`quick-access-card stat-${color} animate-fade-up`}
            style={{ animationDelay: `${400 + i * 50}ms` }}
          >
            <div className="quick-access-content">
              <div className={`quick-access-icon`}>
                <Icon size={22} />
              </div>
              <div className="quick-access-text">
                <div className="quick-access-title">{label}</div>
                <div className="quick-access-desc">{desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .quick-access-card {
          position: relative;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          text-align: left;
        }
        .quick-access-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: var(--border-glow);
          box-shadow: var(--shadow-xl);
        }
        .quick-access-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .quick-access-card:hover::before {
          opacity: 1;
        }
        .quick-access-content {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .quick-access-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .quick-access-card:hover .quick-access-icon {
          transform: rotate(-10deg) scale(1.1);
        }
        .quick-access-title {
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .quick-access-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Thematic coloring for Quick Access */
        .quick-access-card.stat-purple:hover { background: linear-gradient(135deg, var(--bg-card) 0%, rgba(168, 85, 247, 0.1) 100%); }
        .quick-access-card.stat-cyan:hover { background: linear-gradient(135deg, var(--bg-card) 0%, rgba(6, 182, 212, 0.1) 100%); }
        .quick-access-card.stat-success:hover { background: linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.1) 100%); }
        .quick-access-card.stat-warning:hover { background: linear-gradient(135deg, var(--bg-card) 0%, rgba(234, 179, 8, 0.1) 100%); }
        
        .quick-access-card.stat-purple .quick-access-icon { color: #a855f7; }
        .quick-access-card.stat-cyan .quick-access-icon { color: #06b6d4; }
        .quick-access-card.stat-success .quick-access-icon { color: #22c55e; }
        .quick-access-card.stat-warning .quick-access-icon { color: #eab308; }
      `}</style>
    </div>
  );
}
