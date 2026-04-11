import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portalPath = user ? `/${user.role}` : '/';

  return (
    <nav className="glass-nav">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem' }}>
        <Link to={portalPath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={24} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '1.2rem' }} className="text-gradient">MediTrack</span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <User size={16} />
              <span>{user.email}</span>
              <span style={{ background: 'rgba(0,255,157,0.15)', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
