import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Mail, Phone, Calendar, UserCircle } from 'lucide-react';

export default function DoctorPatients() {
  const { authFetch } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/doctor/patients')
      .then(res => setPatients(Array.isArray(res) ? res : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>My <span className="text-gradient">Patients</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>A comprehensive list of all patients registered under your care.</p>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Patient Directory</h2>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading patients...</p>
        ) : patients.length === 0 ? (
           <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>You have no registered patients yet. Wait for an appointment to be booked!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Health Info</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                          {p.first_name?.[0]}{p.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}><Mail size={12} color="var(--text-muted)"/> {p.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={12} color="var(--text-muted)"/> {p.phone || 'N/A'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <div>Gender: {p.gender || '—'}</div>
                      <div>Blood: {p.blood_group || '—'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                        <Calendar size={14} /> {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
