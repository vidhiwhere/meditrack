import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, User, Stethoscope, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authFetch('/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={16} color="var(--primary)" />;
      case 'doctor': return <Stethoscope size={16} color="var(--secondary)" />;
      default: return <User size={16} color="var(--text-muted)" />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>User <span className="text-gradient">Management</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>View and manage all registered users.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>All Users</h2>
          <span style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
            {users.length} Total
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No users found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const name = u.role === 'patient' ? `${u.p_first || ''} ${u.p_last || ''}`.trim() : 
                               u.role === 'doctor' ? `${u.d_first || ''} ${u.d_last || ''}`.trim() : 'Admin';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {u.id.substring(0, 8)}...</div>
                      </td>
                      <td>
                        <div>{u.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'capitalize' }}>
                          {getRoleIcon(u.role)} {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: u.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: u.status === 'active' ? '#22c55e' : '#ef4444'
                        }}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
