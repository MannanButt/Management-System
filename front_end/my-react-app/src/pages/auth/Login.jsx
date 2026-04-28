import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { loginUser } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo">
          <div className="auth-logo-icon"><School size={22} color="#fff" /></div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#fff,#9f67ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Student Management</span>
        </div>

        <h1 className="auth-title">Welcome back 👋</h1>
        <p className="auth-subtitle">Sign in to your account to continue.</p>

        {error && (
          <div className="alert alert-error animate-fade-up" style={{ marginBottom: '20px' }}>
            <span>⚠ {error}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="login-email" name="email" type="email" className="form-input" placeholder="you@example.com"
                style={{ paddingLeft: '40px' }} value={form.email} onChange={handle} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Password
              <Link to="/forgot-password" className="auth-link" style={{ fontWeight: 500, fontSize: '0.8rem' }}>Forgot password?</Link>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="login-password" name="password" type={showPw ? 'text' : 'password'} className="form-input"
                placeholder="••••••••" style={{ paddingLeft: '40px', paddingRight: '44px' }}
                value={form.password} onChange={handle} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <LogIn size={18} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
