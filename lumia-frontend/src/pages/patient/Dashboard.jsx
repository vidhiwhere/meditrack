import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Calendar, Activity, Brain, Users, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const links = [
    { to: '/patient', label: 'Dashboard', icon: Activity },
    { to: '/patient/symptoms', label: 'AI Symptoms', icon: Brain },
    { to: '/patient/appointments', label: 'Appointments', icon: Calendar },
    { to: '/patient/family', label: 'Family', icon: Users },
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

function HealthScoreGauge({ score }) {
  const color = score >= 80 ? 'var(--primary)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg viewBox="0 0 120 120" width={140} height={140}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="22" fontWeight="700">{score}</text>
        <text x="60" y="78" textAnchor="middle" fill="#94a3b8" fontSize="9">/100</text>
      </svg>
      <span style={{ color, fontWeight: 700 }}>{score >= 80 ? 'Excellent' : score >= 50 ? 'Moderate' : 'Needs Attention'}</span>
    </div>
  );
}

function UrgencyBadge({ level }) {
  const colors = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', EMERGENCY: '#ef4444' };
  const color = colors[level] || '#94a3b8';
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
      {level}
    </span>
  );
}

export default function PatientDashboard() {
  const { authFetch, user } = useAuth();
  const [healthScore, setHealthScore] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch('/patient/health-score').catch(() => ({ score: null })),
      authFetch('/patient/symptoms').catch(() => []),
      authFetch('/appointment/list').catch(() => []),
    ]).then(([scoreData, symptomsData, apptData]) => {
      setHealthScore(scoreData.score ?? scoreData.health_risk_score ?? 72);
      setSymptoms(Array.isArray(symptomsData) ? symptomsData.slice(0, 5) : []);
      setAppointments(Array.isArray(apptData) ? apptData.slice(0, 5) : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <p>Loading your health data...</p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
          Welcome back, <span className="text-gradient">{user?.email?.split('@')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's your health overview for today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Health Score */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Heart size={16} color="var(--danger)" fill="var(--danger)" /> Health Risk Score
          </div>
          <HealthScoreGauge score={healthScore || 72} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            AI-powered score based on your symptom history
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              { label: 'Total Symptoms Logged', value: symptoms.length, icon: Brain, color: 'var(--secondary)' },
              { label: 'Upcoming Appointments', value: appointments.filter(a => a.status === 'SCHEDULED').length, icon: Calendar, color: 'var(--primary)' },
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

          {/* Quick Action */}
          <Link to="/patient/symptoms" className="glass-panel" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '1.2rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,255,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={20} color="var(--primary)" />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Check my symptoms with AI</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Get instant triage & specialist recommendations</p>
              </div>
            </div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </Link>
        </div>
      </div>

      {/* Recent Symptoms */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Symptoms</h2>
          <Link to="/patient/symptoms" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>View all →</Link>
        </div>
        {symptoms.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No symptoms logged yet. <Link to="/patient/symptoms" style={{ color: 'var(--primary)' }}>Log your first one →</Link></p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Symptom</th><th>Urgency</th><th>Date</th></tr>
            </thead>
            <tbody>
              {symptoms.map((s) => (
                <tr key={s.id}>
                  <td style={{ maxWidth: 300 }}>{s.raw_text?.substring(0, 80)}...</td>
                  <td><UrgencyBadge level={s.urgency} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.timeline_date ? new Date(s.timeline_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Upcoming Appointments</h2>
          <Link to="/patient/appointments" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>Book new →</Link>
        </div>
        {appointments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No appointments booked.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {appointments.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {a.status === 'COMPLETED' ? <CheckCircle size={20} color="var(--primary)" /> : a.status === 'CANCELLED' ? <AlertTriangle size={20} color="var(--danger)" /> : <Calendar size={20} color="var(--secondary)" />}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.pre_visit_notes?.substring(0, 50) || 'General Consultation'}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}</p>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: 99, background: a.status === 'COMPLETED' ? 'rgba(0,255,157,0.1)' : 'rgba(255,255,255,0.05)', color: a.status === 'COMPLETED' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { Sidebar as PatientSidebar };
