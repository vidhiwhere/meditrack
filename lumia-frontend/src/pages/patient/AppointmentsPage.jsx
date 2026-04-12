import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AppointmentsPage() {
  const { authFetch } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAppointments = () => {
    authFetch('/appointment/list').then(data => setAppointments(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  };
  
  const fetchDoctors = () => {
    authFetch('/appointment/doctors').then(data => setAvailableDoctors(Array.isArray(data) ? data : [])).catch(err => console.error(err));
  };

  useEffect(() => { 
    fetchAppointments(); 
    fetchDoctors();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await authFetch('/appointment/book', { method: 'POST', body: JSON.stringify(form) });
      setSuccess('Appointment booked! You will receive a WhatsApp reminder.');
      setForm({ doctorId: '', date: '', time: '', reason: '' });
      setBooking(false);
      fetchAppointments();
    } catch (err) { setError(err.message); }
  };

  const statusIcon = { SCHEDULED: <Clock size={16} color="#f59e0b"/>, BOOKED: <Clock size={16} color="#f59e0b"/>, COMPLETED: <CheckCircle size={16} color="#22c55e"/>, CANCELLED: <XCircle size={16} color="#ef4444"/> };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>My <span className="text-gradient">Appointments</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>View and manage your doctor appointments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setBooking(!booking)}>
          <Calendar size={16} /> {booking ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {booking && (
        <div className="glass-panel" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>New Appointment</h2>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: 'var(--primary)', fontSize: '0.85rem' }}>{success}</div>}
          <form onSubmit={handleBook}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Select Doctor</label>
                <select className="input-field" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} required>
                  <option value="" disabled>Choose a Specialist...</option>
                  {availableDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.first_name} {doc.last_name} — {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Time</label>
                <input type="time" className="input-field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Reason for visit</label>
                <input className="input-field" placeholder="e.g. Routine checkup" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Confirm Booking</button>
          </form>
        </div>
      )}

      <div className="glass-panel">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p>No appointments found. Book your first one!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date & Time</th><th>Reason</th><th>Status</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.pre_visit_notes || 'General Consultation'}</td>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{statusIcon[a.status]}{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
