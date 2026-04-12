import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Brain, Send, AlertTriangle, CheckCircle, Clock, Stethoscope } from 'lucide-react';

const urgencyConfig = {
  EMERGENCY: { color: '#ef4444', icon: AlertTriangle, label: 'Emergency - Seek immediate care now!' },
  HIGH: { color: '#f97316', icon: AlertTriangle, label: 'High Priority - See a doctor today' },
  MEDIUM: { color: '#f59e0b', icon: Clock, label: 'Moderate - Schedule appointment within a few days' },
  LOW: { color: '#22c55e', icon: CheckCircle, label: 'Low Priority - Monitor your symptoms' },
};

export default function SymptomsPage() {
  const { authFetch } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await authFetch('/symptom/analyze', {
        method: 'POST',
        body: JSON.stringify({ text: input }),
      });
      setResult(data);
      setHistory((prev) => [{ input, result: data, time: new Date() }, ...prev.slice(0, 4)]);
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const urgency = result?.urgency ? urgencyConfig[result.urgency] : null;
  const UrgencyIcon = urgency?.icon || CheckCircle;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>AI Symptom <span className="text-gradient">Analyzer</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Describe your symptoms in plain English. Our AI will analyze and guide you.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Input Panel */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Brain size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Describe Your Symptoms</h2>
          </div>

          <textarea
            className="input-field"
            rows={7}
            placeholder="e.g. I have been having a severe headache on the left side of my head for the past 2 days. It worsens with light and I feel nauseous..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
          />

          {/* Example prompts */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
            {['Chest pain and shortness of breath', 'Recurring fever with chills', 'Skin rash and itching'].map((s) => (
              <button key={s} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', borderRadius: 99, padding: '0.3rem 0.8rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif' }}
                onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAnalyze} disabled={loading || !input.trim()}>
            {loading ? <><span style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Analyzing...</> : <><Send size={16} /> Analyze with AI</>}
          </button>
        </div>

        {/* Result Panel */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
              {/* Urgency Banner */}
              <div style={{ padding: '1.25rem 1.5rem', borderRadius: 16, background: `${urgency?.color}18`, border: `1px solid ${urgency?.color}44`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UrgencyIcon size={24} color={urgency?.color} />
                <div>
                  <p style={{ fontWeight: 700, color: urgency?.color, fontSize: '0.95rem' }}>{result.urgency} URGENCY</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.1rem' }}>{urgency?.label}</p>
                </div>
              </div>

              {/* Extracted Conditions */}
              {result.conditions?.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Possible Conditions</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.conditions.map((c) => (
                      <span key={c} style={{ padding: '0.3rem 0.8rem', borderRadius: 99, background: 'rgba(139,92,246,0.15)', color: 'var(--secondary)', border: '1px solid rgba(139,92,246,0.3)', fontSize: '0.85rem' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Recommendation */}
              {result.doctor_type && (
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,255,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Stethoscope size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Recommended Specialist</p>
                    <p style={{ fontWeight: 700, fontSize: '1rem' }}>{result.doctor_type}</p>
                  </div>
                </div>
              )}

              {/* AI Advice */}
              {result.advice && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>AI Advice</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{result.advice}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem', minHeight: 320 }}>
              <Brain size={48} color="rgba(139,92,246,0.4)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your AI analysis results will appear here.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Describe your symptoms as naturally as you would.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

<style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
`}</style>
