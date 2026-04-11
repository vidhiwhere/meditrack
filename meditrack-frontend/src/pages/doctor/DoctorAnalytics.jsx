import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart2, Users, FileText, CheckCircle, Clock } from 'lucide-react';

export default function DoctorAnalytics() {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/doctor/analytics')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>;
  if (!data) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available.</div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Practice <span className="text-gradient">Analytics</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of your performance and consultations.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Appointments', value: data.totalAppointments, icon: Clock, color: 'var(--primary)' },
          { label: 'Completion Rate', value: `${data.completionRate}%`, icon: CheckCircle, color: '#22c55e' },
          { label: 'Prescriptions Issued', value: data.prescriptionsIssued, icon: FileText, color: 'var(--secondary)' },
          { label: 'Unique Patients', value: data.patientsSeen, icon: Users, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: `${color}20`, color }}><Icon size={22} /></div>
            <div>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart2 size={20} color="var(--primary)" /> Estimated Consultation Revenue
        </h3>
        <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem', color: 'var(--text-color)' }}>
          ₹{data.totalRevenue?.toLocaleString()}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Based on successfully completed appointments.</p>
        
        {/* Visual Bar representation of completion rate */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Completed Appointments</span>
            <span style={{ fontWeight: 700 }}>{data.completedAppointments} / {data.totalAppointments}</span>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${data.completionRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 1s ease-in-out' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
