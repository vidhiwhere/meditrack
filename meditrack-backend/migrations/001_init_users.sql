-- Migration 001: Initialize users table

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'patient', 'doctor', 'admin'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_approval'
  language VARCHAR(10) DEFAULT 'en', -- 'en', 'hi', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
