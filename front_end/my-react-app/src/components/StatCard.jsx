export default function StatCard({ icon: Icon, label, value, color = 'purple', delay = 0 }) {
  return (
    <div className={`stat-card glass stat-${color} animate-fade-up`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-icon">
        <Icon size={22} />
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
