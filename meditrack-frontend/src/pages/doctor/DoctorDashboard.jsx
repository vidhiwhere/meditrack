import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Calendar, FileText, BarChart2, Clock, CheckCircle, XCircle, Send, Users } from 'lucide-react';

function DoctorSidebar() {
  const location = useLocation();
  const links = [
    { to: '/doctor', label: 'Queue', icon: Stethoscope },
    { to: '/doctor/patients', label: 'My Patients', icon: Users },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { to: '/doctor/analytics', label: 'Analytics', icon: BarChart2 },
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

function StatusBadge({ status }) {
  const map = { BOOKED: ['#f59e0b', Clock], COMPLETED: ['#22c55e', CheckCircle], CANCELLED: ['#ef4444', XCircle], SCHEDULED: ['#f59e0b', Clock] };
  const [color, Icon] = map[status] || ['#94a3b8', Clock];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${color}20`, color, border: `1px solid ${color}44`, padding: '0.25rem 0.7rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600 }}><Icon size={12}/> {status}</span>;
}

export default function DoctorDashboard() {
  const { authFetch, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [prescForm, setPrescForm] = useState({ medicineName: '', dosage: '', frequency: '', duration: '' });
  const [prescError, setPrescError] = useState('');
  const [prescSuccess, setPrescSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      authFetch('/doctor/appointments').catch(() => []),
      authFetch('/doctor/analytics').catch(() => null),
    ]).then(([appts, analytics]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setAnalytics(analytics);
    }).finally(() => setLoading(false));
  }, []);

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    setPrescError(''); setPrescSuccess('');
    try {
      await authFetch('/doctor/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: prescriptionModal.id,
          patientId: prescriptionModal.patient_id,
          medications: [{ name: prescForm.medicineName, dosage: prescForm.dosage, frequency: prescForm.frequency, duration: prescForm.duration }],
        }),
      });
      setPrescSuccess('Prescription issued! Patient will receive a WhatsApp notification.');
      setPrescForm({ medicineName: '', dosage: '', frequency: '', duration: '' });
      setTimeout(() => setPrescriptionModal(null), 2000);
    } catch (err) { setPrescError(err.message); }
  };

  const todaysQueue = appointments.filter(a => a.status === 'BOOKED' || a.status === 'SCHEDULED');

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Doctor <span className="text-gradient">Dashboard</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your patients and appointments.</p>
      </div>

      {/* Analytics row */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: "Today's Queue", value: todaysQueue.length, icon: Clock, color: 'var(--primary)' },
          { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'var(--secondary)' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle, color: '#22c55e' },
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

      {/* Patient Queue */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Patient Queue</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No appointments yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Patient ID</th><th>Scheduled At</th><th>Notes</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.patient_id?.substring(0, 12)}…</td>
                  <td style={{ fontSize: '0.85rem' }}>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.pre_visit_notes?.substring(0, 40) || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {(a.status === 'BOOKED' || a.status === 'SCHEDULED') && (
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setPrescriptionModal(a)}>
                        <Send size={14} /> Issue Rx
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Prescription Modal */}
      {prescriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 480, animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Issue Prescription <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>— Appointment #{prescriptionModal.id?.substring(0, 8)}</span>
            </h2>
            {prescError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: 10, color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>{prescError}</div>}
            {prescSuccess && <div style={{ background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.3)', padding: '0.75rem', borderRadius: 10, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{prescSuccess}</div>}
            <form onSubmit={handleIssuePrescription}>
              {[['Medicine Name', 'medicineName', 'e.g. Amoxicillin'], ['Dosage', 'dosage', 'e.g. 500mg'], ['Frequency', 'frequency', 'e.g. Twice daily'], ['Duration', 'duration', 'e.g. 5 days']].map(([label, key, placeholder]) => (
                <div className="input-group" key={key}>
                  <label>{label}</label>
                  <input className="input-field" placeholder={placeholder} value={prescForm[key]} onChange={(e) => setPrescForm({ ...prescForm, [key]: e.target.value })} required />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Issue Prescription</button>
                <button type="button" className="btn btn-secondary" onClick={() => setPrescriptionModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { DoctorSidebar };
