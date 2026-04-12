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
  const map = { 
    BOOKED: ['var(--warning)', Clock], 
    COMPLETED: ['var(--success)', CheckCircle], 
    CANCELLED: ['var(--danger)', XCircle], 
    SCHEDULED: ['var(--warning)', Clock] 
  };
  const [color, Icon] = map[status] || ['var(--text-muted)', Clock];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${color}15`, color, border: `1px solid ${color}33`, padding: '0.4rem 0.9rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}><Icon size={12}/> {status}</span>;
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
  const [completing, setCompleting] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [feeForm, setFeeForm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    console.log('--- Doctor Dashboard Version 2.0 Loaded ---');
    Promise.all([
      authFetch('/doctor/appointments').catch(() => ({ appointments: [] })),
      authFetch('/doctor/analytics').catch(() => null),
      authFetch('/appointment/doctors').then(docs => {
         // Find current logged in doctor in the list (or we could have a /doctor/profile endpoint)
         // Since we don't have a direct /doctor/profile, we'll try to find by ID if we had it, 
         // but we can just use the first one for now or a fallback.
         // Actually, let's assume a default of 500 if not found.
         return docs;
      }).catch(() => [])
    ]).then(([apptData, analytics, docs]) => {
      // Service returns { appointments: [...], total: N }
      const appts = apptData?.appointments ?? (Array.isArray(apptData) ? apptData : []);
      setAppointments(appts);
      setAnalytics(analytics);
      
      // Try to find the default fee for this doctor
      // (Improvements: Add /doctor/profile backend route)
      const myDoc = docs.find(d => d.email === user?.email); 
      if (myDoc) setDoctorProfile(myDoc);
    }).finally(() => setLoading(false));
  }, []);

  const openCompleteModal = (appointment) => {
    setCompleteModal(appointment);
    setFeeForm(doctorProfile?.consultation_fee || 500);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!completeModal) return;
    
    const fee = parseFloat(feeForm);
    if (isNaN(fee)) {
      alert('Please enter a valid number for the fee');
      return;
    }

    const appointmentId = completeModal.id;
    setCompleting(appointmentId);
    try {
      await authFetch('/doctor/appointments/status', {
        method: 'PUT',
        body: JSON.stringify({ appointmentId, status: 'COMPLETED', fee }),
      });
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'COMPLETED', fee } : a));
      setAnalytics(prev => ({
        ...prev,
        completedAppointments: (parseInt(prev?.completedAppointments || 0)) + 1,
        totalRevenue: (parseFloat(prev?.totalRevenue || 0)) + fee
      }));
      setCompleteModal(null);
      setSuccessMsg(`Appointment completed. ₹${fee} added to total revenue.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setCompleting(null);
    }
  };

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
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="font-serif" style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>Medical Queue</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Overview of your daily appointments and practice revenue.</p>
        {successMsg && <div style={{ background: 'var(--success)', color: 'white', padding: '1rem', borderRadius: '12px', marginTop: '1rem', animation: 'fadeIn 0.3s ease-out', fontWeight: 600 }}>{successMsg}</div>}
      </div>

      {/* Analytics row */}
      <div className="stat-grid" style={{ marginBottom: '3rem' }}>
        {[
          { label: "Today's Queue", value: todaysQueue.length, icon: Clock, color: 'var(--primary)' },
          { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'var(--secondary)' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle, color: 'var(--success)' },
          { label: 'Total Revenue', value: `₹${parseFloat(analytics?.totalRevenue || 0).toLocaleString()}`, icon: BarChart2, color: 'var(--warning)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: `${color}15`, color }}>
              <Icon size={26} />
            </div>
            <div>
              <p className="stat-value font-serif">{value}</p>
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
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setPrescriptionModal(a)}>
                          <Send size={14} /> Issue Rx
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: completing === a.id ? 0.6 : 1 }}
                          disabled={completing === a.id}
                          onClick={() => openCompleteModal(a)}
                        >
                          <CheckCircle size={14} /> {completing === a.id ? 'Saving…' : 'Complete'}
                        </button>
                      </div>
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

      {/* Complete Appointment Modal */}
      {completeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Finalize Consultation</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Confirming completion for <strong>{completeModal.first_name} {completeModal.last_name}</strong>. Please record the consultation fee.
            </p>
            <form onSubmit={handleComplete}>
              <div className="input-group">
                <label>Consultation Fee (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={feeForm} 
                  onChange={(e) => setFeeForm(e.target.value)} 
                  placeholder="500"
                  autoFocus
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm & Update</button>
                <button type="button" className="btn btn-secondary" onClick={() => setCompleteModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { DoctorSidebar };
