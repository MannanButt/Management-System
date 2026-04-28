import { Inbox } from 'lucide-react';

export default function DataTable({ columns, data, loading, onAdd, addLabel = 'Add New' }) {
  if (loading) {
    return (
      <div className="glass" style={{ padding: '24px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px', opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="glass empty-state">
        <div className="empty-icon"><Inbox size={28} /></div>
        <h3>No records found</h3>
        <p>Get started by adding your first record.</p>
        {onAdd && (
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onAdd}>
            + {addLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card-solid table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((col) => <th key={col.key}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
