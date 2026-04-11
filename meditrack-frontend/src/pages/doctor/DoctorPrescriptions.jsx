import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, QrCode, Clock, Pill } from 'lucide-react';

export default function DoctorPrescriptions() {
  const { authFetch } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/prescription')
      .then(res => setPrescriptions(Array.isArray(res) ? res : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Issued <span className="text-gradient">Prescriptions</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Historical record of all digital prescriptions you've authorized.</p>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FileText size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Prescription History</h2>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
           <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>You have not issued any prescriptions yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Medications</th>
                  <th>Summary</th>
                  <th>QR Hash</th>
                  <th>Issued At</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.id}>
                    <td style={{ fontWeight: 600 }}>{rx.patient_id.substring(0, 8)}...</td>
                    <td>
                      {rx.medications && rx.medications.map((m, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                          <Pill size={12} color="var(--secondary)"/> {m.name} ({m.dosage})
                        </div>
                      ))}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {rx.ai_plain_language_summary?.substring(0, 40)}{rx.ai_plain_language_summary?.length > 40 ? '...' : ''}
                    </td>
                    <td>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.5rem', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--primary)',
                        borderRadius: 4, fontFamily: 'monospace', fontSize: '0.8rem'
                      }}>
                        <QrCode size={12} /> {rx.qr_verification_hash.substring(0, 12)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {new Date(rx.created_at).toLocaleString()}
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
