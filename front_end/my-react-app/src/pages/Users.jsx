import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Trash2, Edit2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { getUsers, deleteUser } from '../api/apiService';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { label: 'All Users', value: undefined },
  { label: 'Students', value: 0 },
  { label: 'Teachers', value: 1 },
  { label: 'Admins', value: 2 },
];

export default function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const load = async (roleOption, s = '', page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * size;
      const res = await getUsers(roleOption, s, skip, size);
      const d = res.data?.data ?? [];
      const total = res.data?.total ?? 0;
      
      setData(Array.isArray(d) ? d : []);
      setTotalItems(total);
    } catch { 
      setData([]); 
      setTotalItems(0);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { 
    load(filter, debouncedSearch, currentPage, pageSize); 
  }, [filter, debouncedSearch, currentPage, pageSize]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      load(filter, debouncedSearch, currentPage, pageSize);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEdit = (u) => {
    navigate(`/users/edit/${u.u_id}`);
  };

  const columns = [
    { key: 'u_id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <span className={`badge badge-${v === 'admin' ? 'purple' : v === 'teacher' ? 'cyan' : 'success'}`}>{v}</span> },
    { key: 'created_at', label: 'Joined', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(row)} title="Edit Role">
            <Edit2 size={14} />
          </button>
          {row.u_id !== currentUser?.u_id && (
            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(row.u_id)} title="Delete User">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header animate-fade-up">
        <div className="page-header-left">
          <h1>Users</h1>
          <p>Manage all system user accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ROLE_OPTIONS.map(({ label, value }) => (
              <button key={label}
                className={`btn btn-sm ${filter === value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleFilterChange(value)}>{label}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="animate-fade-up-1">
        <div className="table-container">
          <DataTable columns={columns} data={data} loading={loading} />
          <Pagination 
            currentPage={currentPage} 
            totalItems={totalItems} 
            pageSize={pageSize} 
            onPageChange={setCurrentPage} 
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </div>
  );
}
