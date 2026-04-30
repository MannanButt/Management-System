import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getCourses, createCourse, updateCourse, deleteCourse, getUsers } from '../api/apiService';

export default function Courses() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ title: '', description: '', t_id: '' });
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
      const [crsRes, tchRes] = await Promise.all([
        getCourses(s, skip, size), 
        getUsers(1, '', 0, 1000) // Get many teachers for dropdown
      ]);
      const d = crsRes.data?.data ?? []; 
      const total = crsRes.data?.total ?? 0;
      
      setData(Array.isArray(d) ? d : []);
      setTotalItems(total);
      setTeachers(tchRes.data?.data ?? []);
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
  }, [debouncedSearch, currentPage, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, t_id: Number(form.t_id) };
      if (modal.type === 'edit') {
        await updateCourse(modal.data.c_id, payload);
      } else {
        await createCourse(payload);
      }
      setModal(null); setForm({ title: '', description: '', t_id: '' }); load(debouncedSearch, currentPage, pageSize);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save course.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await deleteCourse(id); load(debouncedSearch, currentPage, pageSize); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ title: row.title, description: row.description, t_id: row.t_id });
  };

  const handleScheduleExam = (course) => {
    window.location.href = `/examinations?c_id=${course.c_id}`;
  };

  const isAdmin = user?.role === 'admin';
  const canManage = ['admin', 'teacher'].includes(user?.role);

  const columns = [
    { key: 'c_id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v || '—'}</span> },
    { key: 't_id', label: 'Teacher ID' },
    { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => handleScheduleExam(row)} title="Schedule Exam">
             <Plus size={14} style={{ marginRight: '4px' }} /> Exam
          </button>
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.c_id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Courses</h1><p>Manage all available courses</p></div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> New Course</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} onAdd={isAdmin ? () => setModal({ type: 'add' }) : null} addLabel="New Course" />
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
        <Modal title={modal.type === 'edit' ? 'Edit Course' : 'Create Course'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="course-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Create'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="course-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-group"><label className="form-label">Course Title</label>
              <input name="title" className="form-input" placeholder="e.g. Mathematics" value={form.title} onChange={handle} required /></div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea name="description" className="form-input" rows={3} placeholder="Optional description" value={form.description} onChange={handle} style={{ resize: 'vertical' }} /></div>
            <div className="form-group">
              <label className="form-label">Assign Teacher</label>
              <select name="t_id" className="form-input form-select" value={form.t_id} onChange={handle} required disabled={user?.role === 'teacher'}>
                <option value="">— Select Teacher —</option>
                {teachers.map(t => (
                  <option key={t.t_id} value={t.t_id}>{t.name} (Code: {t.employee_code})</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
