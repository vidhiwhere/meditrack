-- Migration 003: Initialize doctors table

CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  specialization VARCHAR(100),
  mci_registration_number VARCHAR(100) UNIQUE NOT NULL,
  mci_verification_status VARCHAR(50) DEFAULT 'pending', -- 'verified', 'rejected'
  license_document_url VARCHAR(500),
  bio TEXT,
  years_experience INT,
  consultation_fee INT,
  rating DECIMAL(3,2),
  total_patients INT DEFAULT 0,
  total_consultations INT DEFAULT 0,
  available_for_online BOOLEAN DEFAULT true,
  available_for_offline BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_mci ON doctors(mci_registration_number);
