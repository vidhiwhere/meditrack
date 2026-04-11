-- Migration 006: Initialize symptoms table

CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  symptom_description TEXT NOT NULL,
  duration_days INT,
  severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
  ai_analysis_result JSONB, -- { conditions: [], urgency: '', doctor_type: '' }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_symptoms_patient_id ON symptoms(patient_id);
CREATE INDEX idx_symptoms_appointment_id ON symptoms(appointment_id);
