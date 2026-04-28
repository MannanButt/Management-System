import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Mail, Lock, User, Phone, Hash, BookOpen, CheckCircle } from 'lucide-react';
import { registerUser } from '../../api/apiService';

const steps = ['Account', 'Profile', 'Done'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(0); // 0=student,1=teacher
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [account, setAccount] = useState({ email: '', password: '', confirmPassword: '' });
  const [student, setStudent] = useState({ name: '', roll_no: '', class_name: '', section: '', date_of_birth: '', contact_no: '' });
  const [teacher, setTeacher] = useState({ name: '', employee_code: '', department: '', qualification: '', contact_no: '' });

  const aHandle = (e) => setAccount({ ...account, [e.target.name]: e.target.value });
  const sHandle = (e) => setStudent({ ...student, [e.target.name]: e.target.value });
  const tHandle = (e) => setTeacher({ ...teacher, [e.target.name]: e.target.value });

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    if (step === 0) {
      if (account.password !== account.confirmPassword) { setError('Passwords do not match.'); return; }
      if (account.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }
    setStep((s) => s + 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      email: account.email,
      password: account.password,
      role_option: role,
      student_payload: role === 0 ? { ...student, date_of_birth: student.date_of_birth || null } : null,
      teacher_payload: role === 1 ? teacher : null,
    };
    try {
      await registerUser(payload);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass" style={{ maxWidth: '520px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon"><School size={22} color="#fff" /></div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#fff,#9f67ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Student Management</span>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((s, i) => (
            <div key={s} className="step-item">
              <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error animate-fade-up" style={{ marginBottom: '16px' }}><span>⚠ {error}</span></div>}

        {/* Step 0: Account */}
        {step === 0 && (
          <form onSubmit={nextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ marginBottom: '4px' }}>Create Account</h2>
            <p className="auth-subtitle" style={{ marginBottom: '8px' }}>Set up your login credentials.</p>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input name="email" type="email" className="form-input" placeholder="you@example.com" style={{ paddingLeft: '38px' }} value={account.email} onChange={aHandle} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Student', 'Teacher'].map((r, i) => (
                  <button key={r} type="button"
                    className={`btn ${role === i ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }} onClick={() => setRole(i)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input name="password" type="password" className="form-input" placeholder="Min 8 characters" style={{ paddingLeft: '38px' }} value={account.password} onChange={aHandle} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input name="confirmPassword" type="password" className="form-input" placeholder="Repeat password" style={{ paddingLeft: '38px' }} value={account.confirmPassword} onChange={aHandle} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: '4px' }}>Next →</button>
          </form>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ marginBottom: '4px' }}>{role === 0 ? 'Student Profile' : 'Teacher Profile'}</h2>
            <p className="auth-subtitle" style={{ marginBottom: '8px' }}>Fill in your profile details.</p>

            {role === 0 ? (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input name="name" className="form-input" placeholder="John Doe" value={student.name} onChange={sHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll No</label>
                    <input name="roll_no" className="form-input" placeholder="STU001" value={student.roll_no} onChange={sHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <input name="class_name" className="form-input" placeholder="10-A" value={student.class_name} onChange={sHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <input name="section" className="form-input" placeholder="A" value={student.section} onChange={sHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input name="date_of_birth" type="date" className="form-input" value={student.date_of_birth} onChange={sHandle} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact No</label>
                    <input name="contact_no" className="form-input" placeholder="+92 300 0000000" value={student.contact_no} onChange={sHandle} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input name="name" className="form-input" placeholder="Jane Smith" value={teacher.name} onChange={tHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee Code</label>
                    <input name="employee_code" className="form-input" placeholder="TCH001" value={teacher.employee_code} onChange={tHandle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input name="department" className="form-input" placeholder="Mathematics" value={teacher.department} onChange={tHandle} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qualification</label>
                    <input name="qualification" className="form-input" placeholder="M.Sc" value={teacher.qualification} onChange={tHandle} />
                  </div>
                  <div className="form-group form-grid-1">
                    <label className="form-label">Contact No</label>
                    <input name="contact_no" className="form-input" placeholder="+92 300 0000000" value={teacher.contact_no} onChange={tHandle} />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }} className="animate-fade-up">
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="var(--success)" />
            </div>
            <h2 style={{ marginBottom: '8px' }}>Account Created!</h2>
            <p style={{ marginBottom: '28px' }}>Your account has been set up successfully. Sign in to get started.</p>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        )}

        {step < 2 && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
