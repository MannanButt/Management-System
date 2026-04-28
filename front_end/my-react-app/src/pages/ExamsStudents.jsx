import { useEffect, useState } from 'react';
import { Plus, Check, X, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getExamsStudents, createExamsStudent, updateExamsStudentStatus, editExamsStudent, deleteExamsStudent, getUsers, getExaminations } from '../api/apiService';

export default function ExamsStudents() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ ex_id: '', s_id: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const load = async (s = '') => {
    setLoading(true);
    try { 
      const [esRes, stdRes, exRes] = await Promise.all([
        getExamsStudents(s).catch(() => ({ data: { data: [] } })),
        getUsers(0).catch(() => ({ data: { data: [] } })),
        getExaminations().catch(() => ({ data: { data: [] } }))
      ]);
      const d = esRes.data?.data ?? esRes.data; 
      setData(Array.isArray(d) ? d : []); 
      setStudents(stdRes.data?.data ?? []);
      setExams(exRes.data?.data ?? []);
    }
    catch (err) { 
      console.error("Load error:", err);
      setData([]); 
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(debouncedSearch); }, [debouncedSearch, user?.role]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, ex_id: Number(form.ex_id), s_id: Number(form.s_id) };
      if (modal.type === 'edit') {
        await editExamsStudent(modal.data.es_id, payload);
      } else {
        if (user?.role === 'teacher') payload.status = 'pending';
        await createExamsStudent(payload);
      }
      setModal(null); setForm({ ex_id: '', s_id: '', status: 'pending' }); load(debouncedSearch);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save exam registration.'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, payload) => {
    try {
      await updateExamsStudentStatus(id, payload);
      load(debouncedSearch);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam registration?')) return;
    try { await deleteExamsStudent(id); load(debouncedSearch); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ ex_id: row.ex_id, s_id: row.s_id, status: row.status, student_status: row.student_status || 'absent' });
  };

  const columns = [
    { key: 'es_id', label: 'ID' },
    { key: 'exam_title', label: 'Examination' },
    { key: 'roll_no', label: 'Roll No' },
    { key: 'student_name', label: 'Student Name' },
    {
      key: 'status', label: 'Admin Status', render: (v) => {
        const colors = { approved: 'success', denied: 'danger', pending: 'warning' };
        return <span className={`badge badge-${colors[v] || 'info'}`}>{v}</span>;
      }
    },
    {
      key: 'student_status', label: 'Student Status', render: (v) => (
        <span className={`badge badge-${v === 'present' ? 'success' : 'danger'}`}>{v || 'absent'}</span>
      )
    },
  ];

  const isAdmin = user?.role === 'admin';
  const isAdminOrTeacher = ['admin', 'teacher'].includes(user?.role);

  if (isAdminOrTeacher) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && row.status === 'pending' && (
            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' }}>
              <button className="btn btn-icon btn-success" onClick={() => handleStatusUpdate(row.es_id, { status: 'approved' })} title="Approve">
                <Check size={14} />
              </button>
              <button className="btn btn-icon btn-danger" onClick={() => handleStatusUpdate(row.es_id, { status: 'denied' })} title="Deny">
                <X size={14} />
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className={`btn btn-sm ${row.student_status === 'present' ? 'btn-success' : 'btn-secondary'}`} 
              onClick={() => handleStatusUpdate(row.es_id, { student_status: 'present' })} title="Mark Present">
              P
            </button>
            <button className={`btn btn-sm ${row.student_status === 'absent' ? 'btn-danger' : 'btn-secondary'}`} 
              onClick={() => handleStatusUpdate(row.es_id, { student_status: 'absent' })} title="Mark Absent">
              A
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
              <Edit2 size={14} />
            </button>
            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.es_id)} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Exam Registrations</h1><p>Register students for examinations</p></div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by student or status..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          {isAdminOrTeacher && <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Register Student</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <DataTable columns={columns} data={data} loading={loading} onAdd={isAdminOrTeacher ? () => setModal({ type: 'add' }) : null} addLabel="Register Student" />
      </div>

      {modal && (
        <Modal title={modal.type === 'edit' ? "Edit Exam Registration" : "Register Student for Exam"} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="es-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Register'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="es-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Select Exam</label>
                <select name="ex_id" className="form-input form-select" value={form.ex_id} onChange={handle} required>
                  <option value="">— Choose Exam —</option>
                  {exams.map(ex => <option key={ex.ex_id} value={ex.ex_id}>{ex.title} (Course ID: {ex.c_id})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Select Student</label>
                <select name="s_id" className="form-input form-select" value={form.s_id} onChange={handle} required>
                  <option value="">— Choose Student —</option>
                  {students.map(s => (
                    <option key={s.u_id} value={s.profile_id || s.s_id || s.u_id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              {isAdmin && (
                <div className="form-grid-2" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group"><label className="form-label">Admin Status</label>
                    <select name="status" className="form-input form-select" value={form.status} onChange={handle}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Student Status</label>
                    <select name="student_status" className="form-input form-select" value={form.student_status} onChange={handle}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
