-- Migration 002: Initialize patients table

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_group VARCHAR(5),
  health_risk_score DECIMAL(3,2),
  family_head_id UUID, -- For family profiles
  emergency_contact_phone VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  medical_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  medications TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  height INT,
  weight INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_family_head ON patients(family_head_id);
