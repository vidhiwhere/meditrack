import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.7)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, background: 'var(--primary)', borderRadius: 20, marginBottom: '1.25rem', color: 'white', boxShadow: '0 8px 16px rgba(232,167,181,0.2)' }}>
            <Activity size={36} />
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            MediTrack
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>The future of personal wellness</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(212,138,138,0.1)', border: '1px solid rgba(212,138,138,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '3rem' }}
                placeholder="hello@wellness.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '3rem' }}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? 'Entering...' : 'Enter Portal'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          New to MediTrack?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Begin your journey</Link>
        </p>

        {/* Quick logins hint */}
        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--bg-accent)', borderRadius: 16, border: '1px solid var(--surface-border)' }}>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Access</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
            {[
              { role: 'Admin', email: 'admin@meditrack.com', pass: 'admin123' },
              { role: 'Doctor', email: 'doctor1@meditrack.com', pass: 'doc123' },
              { role: 'Patient', email: 'patient1@meditrack.com', pass: 'pat123' },
            ].map((d) => (
              <button
                key={d.role}
                type="button"
                style={{ background: 'white', border: '1px solid var(--surface-border)', borderRadius: 12, padding: '0.6rem', cursor: 'pointer', color: 'var(--text-main)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', fontWeight: 600, transition: 'var(--transition)' }}
                onClick={() => setForm({ email: d.email, password: d.pass })}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
