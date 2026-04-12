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
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <Link to={portalPath} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Activity size={22} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.4rem' }} className="font-serif">MediTrack</span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <User size={16} />
              <span style={{ fontWeight: 500 }}>{user.email}</span>
              <span style={{ background: 'var(--secondary)', color: 'var(--text-main)', padding: '0.2rem 0.8rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
