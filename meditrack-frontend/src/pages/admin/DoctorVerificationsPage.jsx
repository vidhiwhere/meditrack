import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle, XCircle, Stethoscope, AlertCircle } from 'lucide-react';

export default function DoctorVerificationsPage() {
  const { authFetch } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [message, setMessage] = useState('');

  const loadDoctors = () => {
    setLoading(true);
    authFetch('/admin/doctors-pending')
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDoctors(); }, []);

  const handleApprove = async (doctorId) => {
    setApproving(doctorId);
    try {
      await authFetch(`/admin/approve-doctor/${doctorId}`, { method: 'POST' });
      setMessage('Doctor approved successfully!');
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setApproving(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (doctorId) => {
    setRejecting(doctorId);
    try {
      await authFetch(`/admin/reject-doctor/${doctorId}`, { method: 'POST' });
      setMessage('Doctor rejected.');
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRejecting(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={28} color="var(--warning)" />
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Doctor <span className="text-gradient">Verifications</span></h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Review and approve pending doctor registration requests.</p>
      </div>

      {message && (
        <div style={{
          background: message.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(0,255,157,0.1)',
          border: `1px solid ${message.startsWith('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(0,255,157,0.3)'}`,
          borderRadius: 12, padding: '0.85rem 1.25rem', marginBottom: '1.5rem',
          color: message.startsWith('Error') ? 'var(--danger)' : 'var(--primary)',
          fontSize: '0.9rem', animation: 'fadeIn 0.3s ease-out'
        }}>
          {message}
        </div>
      )}

      <div className="glass-panel">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <Stethoscope size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p>Loading pending registrations...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>All doctors verified!</p>
            <p style={{ fontSize: '0.9rem' }}>No pending registrations at this time.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', padding: '0.3rem 0.9rem', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700 }}>
                {doctors.length} Pending
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {doctors.map((doc) => (
                <div key={doc.id} style={{
                  padding: '1.25rem 1.5rem', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', flexWrap: 'wrap',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Stethoscope size={22} color="var(--secondary)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{doc.first_name} {doc.last_name}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{doc.email} · {doc.phone}</p>
                      {doc.specializations && (
                        <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {Array.isArray(doc.specializations) ? doc.specializations.join(', ') : doc.specializations}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                      onClick={() => handleApprove(doc.id)}
                      disabled={approving === doc.id}
                    >
                      {approving === doc.id
                        ? '...'
                        : <><CheckCircle size={15} /> Approve</>}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                      onClick={() => handleReject(doc.id)}
                      disabled={rejecting === doc.id}
                    >
                      {rejecting === doc.id
                        ? '...'
                        : <><XCircle size={15} /> Reject</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
