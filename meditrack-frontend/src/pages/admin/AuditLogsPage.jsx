import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Activity, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/admin/audit-logs')
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>DPDP System <span className="text-gradient">Audit Logs</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Compliance tracking for data access across the platform.</p>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ShieldAlert size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Activity Logs</h2>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading logs...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No logs recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Accessing</th>
                  <th>Action</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.user_email || 'System'}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--primary)',
                        borderRadius: 4, fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.resource_accessed || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
