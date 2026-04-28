import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Save, ArrowLeft, Phone, BadgeCheck } from 'lucide-react';
import { getUserById, updateUser } from '../api/apiService';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    role: '',
    password: '',
    name: '',
    contact_no: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getUserById(id);
        const u = res.data?.data ?? res.data;
        setForm({
          email: u.email || '',
          role: u.role || '',
          password: '', // Don't show hashed password
          name: u.name || '',
          contact_no: u.contact_no || ''
        });
      } catch (err) {
        setError('Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Only send non-empty fields
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      
      await updateUser(id, payload);
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading user details...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-icon btn-secondary mb-2" onClick={() => navigate('/users')}>
            <ArrowLeft size={16} />
          </button>
          <h1>Edit User</h1>
          <p>Update account and profile information for {form.email}</p>
        </div>
      </div>

      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error mb-4"><span>⚠ {error}</span></div>}

          <div className="form-section">
            <h3 className="section-title"><Shield size={18} /> Account Credentials</h3>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">System Role</label>
                <div className="input-with-icon">
                  <BadgeCheck size={16} className="input-icon" />
                  <select name="role" className="form-input form-select" value={form.role} onChange={handleChange} required>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password (leave blank to keep current)</label>
                <input name="password" type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-section mt-6">
            <h3 className="section-title"><User size={18} /> Profile Details</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input name="name" className="form-input" placeholder="e.g. John Doe" value={form.name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input name="contact_no" className="form-input" placeholder="e.g. +1 234 567 890" value={form.contact_no} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/users')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : <Save size={18} />}
              {saving ? 'Updating...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .max-w-2xl { max-width: 42rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .flex { display: flex; }
        .justify-end { justify-content: flex-end; }
        .gap-4 { gap: 1rem; }
        
        .form-section {
          padding: 1.5rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          color: var(--primary);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-with-icon .form-input {
          padding-left: 38px;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: var(--text-muted);
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}
