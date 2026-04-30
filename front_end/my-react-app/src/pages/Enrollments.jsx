import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, getUsers, getCourses } from '../api/apiService';

export default function Enrollments() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ s_id: '', c_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const load = async (s = '', page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * size;
      const [enrRes, stdRes, crsRes] = await Promise.all([
        getEnrollments(s, skip, size),
        getUsers(0, '', 0, 1000), // Students
        getCourses('', 0, 1000)
      ]);
      const d = enrRes.data?.data ?? [];
      const total = enrRes.data?.total ?? 0;

      setData(d);
      setTotalItems(total);
      setStudents(stdRes.data?.data ?? []);
      setCourses(crsRes.data?.data ?? []);
    }
    catch { 
      setData([]); 
      setTotalItems(0);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { 
    load(debouncedSearch, currentPage, pageSize); 
  }, [debouncedSearch, currentPage, pageSize, user?.role]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { s_id: Number(form.s_id), c_id: Number(form.c_id) };
      if (modal.type === 'edit') {
        await updateEnrollment(modal.data.e_id, payload);
      } else {
        await createEnrollment(payload);
      }
      setModal(null); setForm({ s_id: '', c_id: '' }); load(debouncedSearch, currentPage, pageSize);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save enrollment.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enrollment?')) return;
    try { await deleteEnrollment(id); load(debouncedSearch, currentPage, pageSize); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ s_id: row.s_id, c_id: row.c_id });
  };

  const canManage = user?.role === 'admin';

  const columns = [
    { key: 'e_id', label: 'ID' },
    { key: 'student_name', label: 'Student' },
    { key: 'course_title', label: 'Course' },
    { key: 'enrolled_at', label: 'Enrolled At', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.e_id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Enrollments</h1><p>Manage student course enrollments</p></div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by student or course..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Enroll Student</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} onAdd={canManage ? () => setModal({ type: 'add' }) : null} addLabel="Enroll Student" />
          <Pagination 
            currentPage={currentPage} 
            totalItems={totalItems} 
            pageSize={pageSize} 
            onPageChange={setCurrentPage} 
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {modal && (
        <Modal title={modal.type === 'edit' ? "Edit Enrollment" : "Enroll Student"} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="enroll-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Enroll'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="enroll-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-group"><label className="form-label">Select Student</label>
              <select name="s_id" className="form-input form-select" value={form.s_id} onChange={handle} required>
                <option value="">— Choose Student —</option>
                {students.map(s => (
                  <option key={s.u_id} value={s.profile_id || s.s_id || s.u_id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Select Course</label>
              <select name="c_id" className="form-input form-select" value={form.c_id} onChange={handle} required>
                <option value="">— Choose Course —</option>
                {courses.map(c => <option key={c.c_id} value={c.c_id}>{c.title}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
