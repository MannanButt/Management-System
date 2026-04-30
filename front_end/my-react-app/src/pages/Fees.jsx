import { useEffect, useState } from 'react';
import { Plus, Check, X, Trash2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getFees, createFee, updateFeeStatus, deleteFee, getUsers } from '../api/apiService';

export default function Fees() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [form, setForm] = useState({ 
    s_id: '', 
    admission_fee: 0, 
    tuition_fee: 0, 
    library_fee: 0, 
    other_fee: 0, 
    amount: 0, 
    due_date: today, 
    status: 'pending' 
  });

  useEffect(() => {
    const total = Number(form.admission_fee) + Number(form.tuition_fee) + Number(form.library_fee) + Number(form.other_fee);
    setForm(prev => ({ ...prev, amount: total }));
  }, [form.admission_fee, form.tuition_fee, form.library_fee, form.other_fee]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (s = '', page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * size;
      const feeRes = await getFees(s, skip, size);
      const d = feeRes.data?.data ?? [];
      const total = feeRes.data?.total ?? 0;
      
      setData(d);
      setTotalItems(total);
      
      // Only Admins need the student list to create new fee records
      if (user?.role === 'admin') {
        const stdRes = await getUsers(0, '', 0, 1000);
        setStudents(stdRes.data?.data ?? []);
      }
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

  useEffect(() => {
    if (modal && user?.role === 'student' && user?.profileId) {
      setForm(prev => ({ ...prev, s_id: user.profileId }));
    }
  }, [modal, user]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { 
        ...form, 
        s_id: Number(form.s_id), 
        amount: Number(form.amount),
        admission_fee: Number(form.admission_fee),
        tuition_fee: Number(form.tuition_fee),
        library_fee: Number(form.library_fee),
        other_fee: Number(form.other_fee)
      };
      if (user?.role === 'student') payload.status = 'pending';
      await createFee(payload);
      setModal(false); 
      setForm({ s_id: '', admission_fee: 0, tuition_fee: 0, library_fee: 0, other_fee: 0, amount: 0, due_date: today, status: 'pending' }); 
      load(debouncedSearch, currentPage, pageSize);
    } catch (err) { setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save fee.'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateFeeStatus(id, status);
      load(debouncedSearch, currentPage, pageSize);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee record?')) return;
    try { await deleteFee(id); load(debouncedSearch, currentPage, pageSize); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const canManage = user?.role === 'admin';

  const columns = [
    { key: 'f_id', label: 'ID' },
    { key: 'student_name', label: 'Student' },
    { key: 'admission_fee', label: 'Admission', render: (v) => `$${parseFloat(v || 0).toFixed(2)}` },
    { key: 'tuition_fee', label: 'Tuition', render: (v) => `$${parseFloat(v || 0).toFixed(2)}` },
    { key: 'library_fee', label: 'Library', render: (v) => `$${parseFloat(v || 0).toFixed(2)}` },
    { key: 'other_fee', label: 'Other', render: (v) => `$${parseFloat(v || 0).toFixed(2)}` },
    { key: 'amount', label: 'Total', render: (v) => <strong style={{color: 'var(--text-primary)'}}>${parseFloat(v).toFixed(2)}</strong> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v === 'paid' ? 'success' : v === 'overdue' ? 'danger' : 'warning'}`}>{v}</span> },
    { key: 'paid_at', label: 'Approved At', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  if (canManage) {
    columns.push({
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'pending' && (
            <>
              <button className="btn btn-icon btn-success" onClick={() => handleStatusUpdate(row.f_id, 'paid')} title="Approve (Paid)">
                <Check size={14} />
              </button>
              <button className="btn btn-icon btn-danger" onClick={() => handleStatusUpdate(row.f_id, 'overdue')} title="Deny (Overdue/Rejected)">
                <X size={14} />
              </button>
            </>
          )}
          <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.f_id)} title="Delete Fee Record">
            <Trash2 size={14} />
          </button>
        </div>
      )
    });
  }

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left"><h1>Fees</h1><p>Detailed fee structure and tracking</p></div>
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
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> New Fee</button>
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} onAdd={() => setModal(true)} addLabel="New Fee" />
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
        <Modal title={isStudent ? "Pay / Add Fee Request" : "Add Fee Record"} onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="fee-form" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : null}{saving ? 'Saving…' : isStudent ? 'Submit Request' : 'Add Fee'}
            </button>
          </>}>
          {error && <div className="alert alert-error"><span>⚠ {error}</span></div>}
          <form id="fee-form" onSubmit={save} style={{ display: 'contents' }}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Select Student</label>
                <select name="s_id" className="form-input form-select" value={form.s_id} onChange={handle} required disabled={isStudent}>
                  <option value="">— Choose Student —</option>
                  {students.map(s => (
                    <option key={s.u_id} value={s.profile_id || s.s_id || s.u_id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Admission Fee ($)</label>
                <input name="admission_fee" type="number" min="0" step="0.01" className="form-input" value={form.admission_fee} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Tuition Fee ($)</label>
                <input name="tuition_fee" type="number" min="0" step="0.01" className="form-input" value={form.tuition_fee} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Library Fee ($)</label>
                <input name="library_fee" type="number" min="0" step="0.01" className="form-input" value={form.library_fee} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Other Fee ($)</label>
                <input name="other_fee" type="number" min="0" step="0.01" className="form-input" value={form.other_fee} onChange={handle} /></div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Total Amount ($)</label>
                <input name="amount" type="number" className="form-input" value={form.amount} readOnly style={{ background: 'var(--bg-card)', fontWeight: 'bold' }} />
              </div>
              <div className="form-group"><label className="form-label">Submission Date</label>
                <input name="due_date" type="date" className="form-input" value={form.due_date} onChange={handle} required /></div>
              {!isStudent && (
                <div className="form-group"><label className="form-label">Status</label>
                  <select name="status" className="form-input form-select" value={form.status} onChange={handle}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
