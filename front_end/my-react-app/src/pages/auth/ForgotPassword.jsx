import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School, Mail, CheckCircle, Lock } from 'lucide-react';
import { sendOTP, verifyOTP, resetPassword } from '../../api/apiService';

const steps = ['Email', 'Verify OTP', 'New Password'];

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const handleOtpChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const step0 = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await sendOTP(email); setStep(1); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const step1 = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await verifyOTP(email, otp.join(''));
      setResetToken(res.data.data?.reset_token || res.data.reset_token || '');
      setStep(2);
    }
    catch (err) { setError(err.response?.data?.detail || 'Invalid or expired OTP.'); }
    finally { setLoading(false); }
  };

  const step2 = async (e) => {
    e.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try { await resetPassword(resetToken, newPassword); setStep(3); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo">
          <div className="auth-logo-icon"><School size={22} color="#fff" /></div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg,#fff,#9f67ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Student Management</span>
        </div>

        <div className="stepper" style={{ marginBottom: '28px' }}>
          {steps.map((s, i) => (
            <div key={s} className="step-item">
              <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error animate-fade-up" style={{ marginBottom: '16px' }}><span>⚠ {error}</span></div>}

        {step === 0 && (
          <form onSubmit={step0} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Forgot Password?</h2>
              <p className="auth-subtitle">Enter your email and we'll send a 6-digit OTP.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" placeholder="you@example.com" style={{ paddingLeft: '38px' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <Mail size={16} />}
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={step1} style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: '4px' }}>Check your inbox</h2>
              <p>Enter the 6-digit code sent to <strong style={{ color: 'var(--accent-light)' }}>{email}</strong></p>
            </div>
            <div className="otp-inputs">
              {otp.map((d, i) => (
                <input key={i} className="otp-input" maxLength={1} value={d}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  ref={(el) => (otpRefs.current[i] = el)} />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || otp.join('').length < 6}>
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button type="button" className="btn btn-secondary btn-full" onClick={() => { setStep(0); setOtp(['','','','','','']); }}>← Use a different email</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={step2} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Set New Password</h2>
              <p className="auth-subtitle">Choose a strong password for your account.</p>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" className="form-input" placeholder="Min 8 characters" style={{ paddingLeft: '38px' }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" className="form-input" placeholder="Repeat password" style={{ paddingLeft: '38px' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }} className="animate-fade-up">
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} color="var(--success)" />
            </div>
            <h2 style={{ marginBottom: '8px' }}>Password Reset!</h2>
            <p style={{ marginBottom: '28px' }}>Your password has been updated successfully.</p>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        )}

        {step < 3 && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Remembered it? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
