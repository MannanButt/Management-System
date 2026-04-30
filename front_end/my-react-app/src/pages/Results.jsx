import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getResults, createResult, updateResult, deleteResult, getExamsStudents } from '../api/apiService';

const gradeColor = (g) => {
  if (!g) return 'cyan';
  if (['A+', 'A'].includes(g)) return 'success';
  if (['B+', 'B'].includes(g)) return 'cyan';
  if (['C+', 'C'].includes(g)) return 'warning';
  return 'danger';
};

export default function Results() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [examStudents, setExamStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit', data?: ... }
  const [form, setForm] = useState({ es_id: '', marks_obtained: '', total_marks: '', grade: '' });
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
      const [res, esRes] = await Promise.all([
        getResults(s, skip, size), 
        getExamsStudents('', 0, 1000)
      ]);
      const d = res.data?.data ?? []; 
      const total = res.data?.total ?? 0;

      setData(d); 
      setTotalItems(total);
      setExamStudents(esRes.data?.data ?? []);
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
      const payload = {
        es_id: Number(form.es_id),
        marks_obtained: parseFloat(form.marks_obtained),
        total_marks: parseFloat(form.total_marks),
        grade: form.grade || null,
      };
      if (modal.type === 'edit') {
        await updateResult(modal.data.r_id, payload);
      } else {
        await createResult(payload);
      }
      setModal(null); setForm({ es_id: '', marks_obtained: '', total_marks: '', grade: '' }); load(debouncedSearch, currentPage, pageSize);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save result.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try { await deleteResult(id); load(debouncedSearch, currentPage, pageSize); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleEdit = (row) => {
    setModal({ type: 'edit', data: row });
    setForm({ es_id: row.es_id, marks_obtained: row.marks_obtained, total_marks: row.total_marks, grade: row.grade || '' });
  };

  const canManage = ['admin', 'teacher'].includes(user?.role);

  const columns = [
    { key: 'r_id', label: 'ID' },
    { key: 'student_name', label: 'Student' },
    { key: 'marks_obtained', label: 'Marks Obtained', render: (v) => parseFloat(v).toFixed(2) },
    { key: 'total_marks', label: 'Total Marks', render: (v) => parseFloat(v).toFixed(2) },
    {
      key: 'grade', label: 'Grade', render: (v) => v
        ? <span className={`badge badge-${gradeColor(v)}`}>{v}</span>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'marks_obtained', label: 'Score %', render: (v, row) =>
        row.total_marks ? `${((parseFloat(v) / parseFloat(row.total_marks)) * 100).toFixed(1)}%` : '—'
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.r_id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Results</h1><p>View and record student exam results</p></div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by student name..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Add Result</button>}
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} onAdd={canManage ? () => setModal({ type: 'add' }) : null} addLabel="Add Result" />
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
        <Modal title={modal.type === 'edit' ? "Edit Result" : "Add Result"} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="result-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : modal.type === 'edit' ? 'Update' : 'Add Result'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="result-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-group"><label className="form-label">Select Student Exam Entry</label>
              <select name="es_id" className="form-input form-select" value={form.es_id} onChange={handle} required>
                <option value="">— Choose Entry —</option>
                {examStudents.map(es => <option key={es.es_id} value={es.es_id}>{es.student_name} (Exam ID: {es.ex_id})</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Marks Obtained</label>
                <input name="marks_obtained" type="number" min="0" step="0.01" className="form-input" placeholder="e.g. 85.5" value={form.marks_obtained} onChange={handle} required /></div>
              <div className="form-group"><label className="form-label">Total Marks</label>
                <input name="total_marks" type="number" min="0" step="0.01" className="form-input" placeholder="e.g. 100" value={form.total_marks} onChange={handle} required /></div>
              <div className="form-group form-grid-1"><label className="form-label">Grade (optional)</label>
                <select name="grade" className="form-input form-select" value={form.grade} onChange={handle}>
                  <option value="">— Auto —</option>
                  {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
