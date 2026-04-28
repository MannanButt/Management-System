import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getExaminations, createExamination, updateExamination, deleteExamination, getCourses, getAvailableCoursesForExams } from '../api/apiService';

export default function Examinations() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ title: '', c_id: '', exam_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const load = async (s = '') => {
    setLoading(true);
    try {
      const [exRes, crsRes] = await Promise.all([
        getExaminations(s), 
        user?.role === 'admin' ? getAvailableCoursesForExams() : getCourses()
      ]);
      setData(exRes.data?.data ?? []);
      setCourses(crsRes.data?.data ?? []);
    }
    catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { 
    load(debouncedSearch); 
    // Check if we came from Courses page with a specific c_id
    const params = new URLSearchParams(window.location.search);
    const c_id = params.get('c_id');
    if (c_id && !modal) {
      setModal({ type: 'add' });
      setForm(f => ({ ...f, c_id }));
    }
  }, [debouncedSearch, user?.role]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, c_id: Number(form.c_id) };
      if (modal.type === 'edit') {
        await updateExamination(modal.data.ex_id, payload);
      } else {
        await createExamination(payload);
      }
      setModal(null); setForm({ title: '', c_id: '', exam_date: '' }); load(debouncedSearch);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save examination.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this examination?')) return;
    try { await deleteExamination(id); load(debouncedSearch); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateExamination(id, { status: newStatus });
      load(debouncedSearch);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ title: row.title, c_id: row.c_id, exam_date: row.exam_date, status: row.status || 'upcoming' });
  };

  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const columns = [
    { key: 'ex_id', label: 'ID' },
    { key: 'title', label: 'Exam Title' },
    { key: 'course_title', label: 'Course' },
    { key: 'exam_date', label: 'Exam Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge badge-${v === 'completed' ? 'success' : v === 'ongoing' ? 'warning' : 'info'}`}>
        {v || 'upcoming'}
      </span>
    )},
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'upcoming' || !row.status ? (
            <button className="btn btn-sm btn-warning" onClick={() => handleStatusChange(row.ex_id, 'ongoing')}>
              Start Exam
            </button>
          ) : row.status === 'ongoing' ? (
            <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(row.ex_id, 'completed')}>
              Mark Done
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Finished</span>
          )}
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={14} />
          </button>
          {user.role === 'admin' && (
            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.ex_id)} title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left">
          <h1>Examinations</h1>
          <p>Schedule and manage examinations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by title or status..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> New Exam</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      {modal && (
        <Modal title={modal.type === 'edit' ? "Edit Examination" : "Create Examination"} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="exam-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Create'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="exam-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-group"><label className="form-label">Exam Title</label>
              <input name="title" className="form-input" placeholder="e.g. Midterm 2025" value={form.title} onChange={handle} required /></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Select Course</label>
                <select name="c_id" className="form-input form-select" value={form.c_id} onChange={handle} required>
                  <option value="">— Choose Course —</option>
                  {courses.map(c => <option key={c.c_id} value={c.c_id}>{c.title}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Exam Date</label>
                <input name="exam_date" type="date" className="form-input" value={form.exam_date} onChange={handle} required /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select name="status" className="form-input form-select" value={form.status} onChange={handle}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
