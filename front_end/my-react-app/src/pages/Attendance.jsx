import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getAttendance, createAttendance, updateAttendance, deleteAttendance, getAvailableStudentsForAttendance } from '../api/apiService';

export default function Attendance() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ e_id: '', attendance_date: '', status: 'Present' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const load = async (s = '', page = 1, size = pageSize) => {
    setLoading(true);
    try { 
      const skip = (page - 1) * size;
      const [attRes, enrRes] = await Promise.all([
        getAttendance(s, skip, size),
        getAvailableStudentsForAttendance() // Usually small enough to get all
      ]); 
      const d = attRes.data?.data ?? []; 
      const total = attRes.data?.total ?? 0;

      setData(d); 
      setTotalItems(total);
      setEnrollments(enrRes.data?.data ?? []);
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
      if (modal.type === 'edit') {
        await updateAttendance(modal.data.a_id, { ...form, e_id: Number(form.e_id) });
      } else {
        await createAttendance({ ...form, e_id: Number(form.e_id) });
      }
      setModal(null); setForm({ e_id: '', attendance_date: '', status: 'Present' }); load(debouncedSearch, currentPage, pageSize);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save attendance.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try { await deleteAttendance(id); load(debouncedSearch, currentPage, pageSize); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ e_id: row.e_id, attendance_date: row.attendance_date, status: row.status });
  };

  const canManage = ['admin', 'teacher'].includes(user?.role);

  const columns = [
    { key: 'a_id', label: 'ID' },
    { key: 'roll_no', label: 'Roll No' },
    { key: 'student_name', label: 'Student' },
    { key: 'attendance_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'status', label: 'Status', render: (v) => (
        <span className={`badge badge-${v === 'Present' ? 'success' : v === 'Absent' ? 'danger' : 'warning'}`}>{v}</span>
      )
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.a_id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    });
  }

  const [selectedCourse, setSelectedCourse] = useState('');

  // Extract unique courses from enrollments for the course dropdown
  const availableCourses = Array.from(new Set(enrollments.map(e => JSON.stringify({id: e.c_id, title: e.course_title}))))
    .map(s => JSON.parse(s));

  const filteredStudents = selectedCourse 
    ? enrollments.filter(e => e.c_id === Number(selectedCourse))
    : [];

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Attendance</h1><p>Track daily student attendance records</p></div>
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
          {canManage && <button className="btn btn-primary" onClick={() => { setSelectedCourse(''); setModal({ type: 'add' }); }}><Plus size={16} /> Mark Attendance</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} onAdd={canManage ? () => { setSelectedCourse(''); setModal({ type: 'add' }); } : null} addLabel="Mark Attendance" />
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
        <Modal title={modal.type === 'edit' ? "Edit Attendance" : "Mark Attendance"} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="attendance-form" type="submit" disabled={saving || !form.e_id}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Mark'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="attendance-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Step 1: Choose Course</label>
                <select className="form-input form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
                  <option value="">— Select Course —</option>
                  {availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Step 2: Choose Student (by Roll No)</label>
                <select name="e_id" className="form-input form-select" value={form.e_id} onChange={handle} required disabled={!selectedCourse}>
                  <option value="">{selectedCourse ? "— Select Student —" : "Select a course first"}</option>
                  {filteredStudents.map(e => (
                    <option key={e.e_id} value={e.e_id}>
                      [{e.roll_no}] {e.student_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group"><label className="form-label">Date</label>
                <input name="attendance_date" type="date" className="form-input" value={form.attendance_date} onChange={handle} required /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select name="status" className="form-input form-select" value={form.status} onChange={handle}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
