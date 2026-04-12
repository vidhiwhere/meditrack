import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, Phone, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', phone: '', role: 'patient', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '520px', background: 'rgba(255,255,255,0.7)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'var(--primary)', borderRadius: 18, marginBottom: '1.25rem', color: 'white' }}>
            <Activity size={32} />
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Join MediTrack</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>Start your personal wellness journey today.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(212,138,138,0.1)', border: '1px solid rgba(212,138,138,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--bg-accent)', border: '1px solid var(--primary)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <CheckCircle size={18} color="var(--primary)" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.85rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {['patient', 'doctor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  style={{
                    padding: '1rem', borderRadius: 16, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                    background: form.role === r ? 'var(--primary)' : 'white',
                    border: '1px solid var(--surface-border)',
                    color: form.role === r ? 'white' : 'var(--text-muted)',
                    boxShadow: form.role === r ? '0 8px 16px rgba(232,167,181,0.3)' : 'var(--shadow-sm)',
                    transition: 'var(--transition)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem' }}>First Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" style={{ paddingLeft: '3rem' }} placeholder="John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem' }}>Last Name</label>
              <input type="text" className="input-field" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="input-field" style={{ paddingLeft: '3rem' }} placeholder="you@wellness.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem' }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="tel" className="input-field" style={{ paddingLeft: '3rem' }} placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem' }}>Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem' }}>Confirm</label>
              <input type="password" className="input-field" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '54px', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating journey...' : 'Begin Journey'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Continue to portal</Link>
        </p>
      </div>
    </div>
  );
}
