-- Migration 005: Initialize prescriptions table

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  prescription_data JSONB NOT NULL, -- {medicines: [{name, dosage, frequency, duration}]}
  qr_code_url VARCHAR(500),
  verification_token VARCHAR(255),
  pharmacy_id UUID,
  dispensed_at TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
