import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Stethoscope, BarChart2, ShieldCheck, CheckCircle, Clock, XCircle } from 'lucide-react';

function AdminSidebar() {
  const location = useLocation();
  const links = [
    { to: '/admin', label: 'Overview', icon: BarChart2 },
    { to: '/admin/doctors', label: 'Doctor Verifications', icon: Stethoscope },
    { to: '/admin/users', label: 'Users', icon: Users },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`sidebar-link${location.pathname === to ? ' active' : ''}`}>
            <Icon size={18} /> {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  const loadData = () => {
    Promise.all([
      authFetch('/admin/analytics').catch(() => null),
      authFetch('/admin/doctors-pending').catch(() => []),
    ]).then(([a, docs]) => {
      setAnalytics(a);
      setPendingDoctors(Array.isArray(docs) ? docs : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (doctorId) => {
    setApproving(doctorId);
    try {
      await authFetch(`/admin/approve-doctor/${doctorId}`, { method: 'POST' });
      setPendingDoctors(prev => prev.filter(d => d.id !== doctorId));
    } finally { setApproving(null); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Admin <span className="text-gradient">Overview</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Platform-wide analytics and management.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Patients', value: analytics?.totalPatients ?? '—', icon: Users, color: 'var(--primary)' },
          { label: 'Total Doctors', value: analytics?.totalDoctors ?? '—', icon: Stethoscope, color: 'var(--secondary)' },
          { label: 'Total Appointments', value: analytics?.totalAppointments ?? '—', icon: BarChart2, color: '#22c55e' },
          { label: 'Pending Approvals', value: pendingDoctors.length, icon: ShieldCheck, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: `${color}20`, color }}>
              <Icon size={22} />
            </div>
            <div>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Doctor Verifications */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ShieldCheck size={20} color="var(--warning)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Pending Doctor Verifications</h2>
          {pendingDoctors.length > 0 && (
            <span style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
              {pendingDoctors.length}
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>
        ) : pendingDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No pending verifications! All doctors have been reviewed.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Doctor</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pendingDoctors.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.first_name} {d.last_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{d.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{d.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                        onClick={() => handleApprove(d.id)} disabled={approving === d.id}>
                        {approving === d.id ? '...' : <><CheckCircle size={14} /> Approve</>}
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export { AdminSidebar };
