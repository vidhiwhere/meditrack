# Lumia - Complete Backend & Frontend Build Guide

## Part 1: BACKEND ARCHITECTURE

### Backend File Structure
```
Lumia-backend/
├── config/
│   ├── db.js           (PostgreSQL connection)
│   ├── redis.js        (Redis connection)
│   ├── env.js          (Environment variables)
│   └── constants.js    (App constants)
├── middleware/
│   ├── auth.middleware.js      (JWT verification)
│   ├── rbac.middleware.js      (Role-based access)
│   ├── errorHandler.js         (Error handling)
│   └── validation.js           (Request validation)
├── models/
│   ├── User.js          (Base user model)
│   ├── Patient.js       (Patient-specific)
│   ├── Doctor.js        (Doctor-specific)
│   ├── Admin.js         (Admin-specific)
│   ├── Appointment.js
│   ├── Prescription.js
│   ├── Symptom.js       (For symptom tracking)
│   ├── LabTest.js
│   └── Clinic.js
├── routes/
│   ├── auth.routes.js       (Login, signup, password reset)
│   ├── patient.routes.js    (Patient endpoints)
│   ├── doctor.routes.js     (Doctor endpoints)
│   ├── admin.routes.js      (Admin endpoints)
│   ├── appointment.routes.js
│   ├── prescription.routes.js
│   ├── symptom.routes.js    (Symptom entry & analysis)
│   ├── clinic.routes.js     (B2B clinic endpoints)
│   └── notification.routes.js
├── controllers/
│   ├── auth.controller.js
│   ├── patient.controller.js
│   ├── doctor.controller.js
│   ├── admin.controller.js
│   ├── appointment.controller.js
│   ├── prescription.controller.js
│   └── ...
├── services/
│   ├── auth/
│   │   ├── auth.service.js
│   │   └── tokenService.js
│   ├── patient/
│   │   ├── patient.service.js
│   │   ├── healthScore.service.js
│   │   └── symptomAnalysis.service.js
│   ├── doctor/
│   │   ├── doctor.service.js
│   │   └── analytics.service.js
│   ├── appointment/
│   │   └── appointment.service.js
│   ├── prescription/
│   │   ├── prescription.service.js
│   │   └── drugInteraction.service.js
│   ├── notification/
│   │   ├── whatsapp.service.js
│   │   ├── sms.service.js
│   │   └── email.service.js
│   ├── ai/
│   │   ├── symptomAnalyzer.service.js
│   │   ├── questionnaire.service.js
│   │   └── healthRisk.service.js
│   └── external/
│       ├── twilio.service.js     (WhatsApp/SMS)
│       ├── labTest.service.js    (Lab integration)
│       └── payment.service.js    (If needed)
├── utils/
│   ├── validators.js            (Input validation)
│   ├── logger.js                (Logging)
│   ├── qrCode.js                (QR generation for prescriptions)
│   ├── encrypt.js               (Data encryption)
│   └── dpdp.js                  (DPDP compliance utilities)
├── migrations/
│   ├── 001_init_users.sql
│   ├── 002_init_appointments.sql
│   ├── 003_init_prescriptions.sql
│   └── ...
├── seeds/
│   └── seed.js                  (Initial data)
├── tests/
│   ├── auth.test.js
│   ├── patient.test.js
│   └── ...
├── .env.example
├── .gitignore
├── package.json
└── server.js               (Entry point)
```

### Backend Setup Steps

#### Step 1: Setup Main Entry Point (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = require('./config/db');
const redis = require('./config/redis');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patient', require('./routes/patient.routes'));
app.use('/api/doctor', require('./routes/doctor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/appointment', require('./routes/appointment.routes'));
app.use('/api/prescription', require('./routes/prescription.routes'));
app.use('/api/clinic', require('./routes/clinic.routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message,
    status: err.status || 500 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Step 2: Database Schema (PostgreSQL)
```sql
-- Users table (base for all roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  role VARCHAR(50) NOT NULL, -- 'patient', 'doctor', 'admin'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_approval'
  language VARCHAR(10) DEFAULT 'en', -- 'en', 'hi', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY,
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

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
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

-- Clinics table (B2B)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(15),
  email VARCHAR(255),
  website VARCHAR(500),
  license_number VARCHAR(100),
  established_year INT,
  total_doctors INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctor-Clinic mapping
CREATE TABLE doctor_clinic_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  schedule TEXT, -- JSON for schedule
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  clinic_id UUID REFERENCES clinics(id),
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  consultation_type VARCHAR(50), -- 'online', 'offline'
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Symptoms tracking
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  symptom_description TEXT NOT NULL,
  duration_days INT,
  severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
  ai_analysis_result JSONB, -- { conditions: [], urgency: '', doctor_type: '' }
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
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

-- Lab Tests (for B2B)
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  clinic_id UUID REFERENCES clinics(id),
  test_name VARCHAR(255),
  description TEXT,
  report_data JSONB,
  report_file_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs (DPDP compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Consent records (DPDP compliance)
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(100), -- 'data_processing', 'marketing', 'health_sharing'
  status BOOLEAN DEFAULT false,
  version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 3: Authentication Flow
- **Registration**: Email/phone → validate → hash password → store → JWT
- **Login**: Email/phone + password → verify → generate JWT + refresh token → return tokens
- **Token**: JWT includes: userid, role, permissions
- **Refresh**: Refresh token → new JWT when expired

#### Step 4: Role-Based Access Control (RBAC)
```javascript
const roles = {
  PATIENT: {
    permissions: ['view_own_profile', 'book_appointment', 'view_prescription']
  },
  DOCTOR: {
    permissions: ['view_patients', 'write_prescription', 'manage_schedule']
  },
  ADMIN: {
    permissions: ['approve_doctors', 'view_analytics', 'manage_users']
  },
  CLINIC_OWNER: {
    permissions: ['manage_doctors', 'manage_clinic', 'view_analytics']
  }
};
```

---

## Part 2: FRONTEND ARCHITECTURE

### Frontend Options

#### Option A: Single App with Role-Based UI (Recommended)
- One React app that changes UI based on logged-in user role
- Easier deployment & code sharing
- Better for sharing code logic

#### Option B: Three Separate Apps
- patient-app/ (for patients)
- doctor-app/ (for doctors)
- admin-app/ (for admins)
- Separate development but more complex deployment

### Frontend File Structure (Option A)
```
Lumia-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Modal.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── PasswordReset.jsx
│   │   ├── Patient/
│   │   │   ├── SymptomEntry.jsx
│   │   │   ├── SymptomTimeline.jsx
│   │   │   ├── BookAppointment.jsx
│   │   │   ├── ViewPrescriptions.jsx
│   │   │   ├── HealthScoreDashboard.jsx
│   │   │   ├── Questionnaire.jsx
│   │   │   └── FamilyProfiles.jsx
│   │   ├── Doctor/
│   │   │   ├── AppointmentSchedule.jsx
│   │   │   ├── PatientNotes.jsx
│   │   │   ├── WritePrescription.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── DrugInteractionChecker.jsx
│   │   │   └── ClinicManagement.jsx
│   │   ├── Admin/
│   │   │   ├── DoctorApprovalPanel.jsx
│   │   │   ├── PlatformAnalytics.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   └── UserManagement.jsx
│   │   └── B2B/
│   │       ├── LabTestOrdering.jsx
│   │       ├── ClinicDashboard.jsx
│   │       └── LocationManagement.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── services/
│   │   ├── api.js           (Axios instance)
│   │   ├── authService.js
│   │   ├── patientService.js
│   │   ├── doctorService.js
│   │   ├── appointmentService.js
│   │   ├── prescriptionService.js
│   │   └── socketService.js (WebSocket)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useRole.js
│   │   └── useFetch.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── UserContext.jsx
│   │   └── NotificationContext.jsx
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── components.css
│   └── App.jsx
├── package.json
└── .env.example
```

### Frontend Tech Stack
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^latest",
    "socket.io-client": "^4.0.0",
    "zustand": "^4.0.0",
    "react-query": "^3.0.0",
    "tailwindcss": "^3.0.0",
    "@tanstack/react-table": "^8.0.0",
    "date-fns": "^latest",
    "qrcode": "^latest",
    "i18next": "^latest"
  },
  "devDependencies": {
    "vite": "^4.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## Part 3: BACKEND-FRONTEND CONNECTION

### How They Communicate

#### 1. REST API Communication
```
Frontend                        Backend
   |                               |
   |--- POST /api/auth/login ----->|
   |<---- 200 + JWT Token ---------|
   |
   |--- GET /api/patient/me ------>|
   |     (Header: Authorization: Bearer {JWT})
   |<---- 200 + Patient Data ------|
```

#### 2. Authentication Flow
```javascript
// Frontend: Save JWT after login
localStorage.setItem('token', response.data.token);
localStorage.setItem('refreshToken', response.data.refreshToken);

// Axios interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Refresh token
      return refreshToken().then(() => {
        return api(error.config);
      });
    }
    return Promise.reject(error);
  }
);
```

#### 3. Real-Time Communication (WebSocket)
```javascript
// Backend: Socket.io setup
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('join_appointment_room', (appointmentId) => {
    socket.join(`appointment_${appointmentId}`);
  });
  
  socket.on('appointment_update', (data) => {
    io.to(`appointment_${data.appointmentId}`).emit('appointment_changed', data);
  });
});

// Frontend: Connect to socket
import io from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.emit('join_appointment_room', appointmentId);
socket.on('appointment_changed', (data) => {
  updateAppointmentUI(data);
});
```

#### 4. Complete API Endpoints

|Method|Route|Purpose|Auth|
|------|-----|-------|-----|
|POST|/api/auth/register|Register new user|No|
|POST|/api/auth/login|Login|No|
|POST|/api/auth/refresh|Refresh token|Bearer|
|GET|/api/patient/me|Get patient profile|Bearer|
|POST|/api/patient/symptoms|Submit symptom|Bearer|
|GET|/api/patient/timeline|Get symptom timeline|Bearer|
|POST|/api/appointment/book|Book appointment|Bearer|
|GET|/api/doctor/patients|Get doctor's patients|Bearer|
|POST|/api/prescription/create|Write prescription|Bearer|
|GET|/api/prescription/{id}|Get prescription|Bearer|
|POST|/api/admin/approve-doctor|Approve doctor|Bearer+Admin|
|GET|/api/admin/analytics|Platform analytics|Bearer+Admin|
|POST|/api/clinic/lab-test|Order lab test|Bearer|

---

## Part 4: SETUP CHECKLIST

### Backend Setup
- [ ] Setup Express server (server.js)
- [ ] Configure PostgreSQL connection
- [ ] Configure Redis connection
- [ ] Create database schema
- [ ] Setup JWT authentication
- [ ] Setup RBAC middleware
- [ ] Create service layer for each feature
- [ ] Setup error handling
- [ ] Setup logging
- [ ] Create API routes
- [ ] Setup validation & sanitization
- [ ] Setup CORS & security headers
- [ ] Test with Postman

### Frontend Setup
- [ ] Create React app with Vite
- [ ] Setup routing (React Router)
- [ ] Setup state management (Zustand/Context)
- [ ] Create API service with Axios
- [ ] Setup authentication flow
- [ ] Create UI components per role
- [ ] Setup WebSocket for real-time
- [ ] Setup i18n for multi-language
- [ ] Setup testing
- [ ] Deploy build

### Deployment
- [ ] Deploy backend to Heroku/AWS/Railway
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Setup CI/CD pipelines
- [ ] Configure environment variables
- [ ] Setup SSL/TLS
- [ ] Monitor & logging setup

---

## Part 5: INTEGRATION MAP

```
┌─────────────────────┐
│   React Frontend    │
│  (Patient/Doctor)   │
└──────────┬──────────┘
           │
     REST API (HTTPS)
   JWT Bearer Token
           │
┌──────────▼──────────┐
│  Express Backend    │ ◄──────► PostgreSQL
│   (Node.js)         │          (Database)
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
   Redis      External
(Cache/Queue)  Services
              (Twilio,
               AI API)
```

---

## Next Steps

1. **Create Database Schema**: Run migrations on PostgreSQL
2. **Build Authentication Service**: Login/Register/Token management
3. **Build Patient Module**: Symptom entry, timeline, AI analysis
4. **Build Doctor Module**: Appointment management, prescriptions
5. **Build Admin Module**: Doctor approval, analytics
6. **Setup Frontend**: React app with all 4 role-based UIs
7. **Connect Frontend-Backend**: Integrate API calls
8. **Add Real-time Features**: WebSocket for notifications
9. **Testing & Deployment**: Unit tests, E2E tests, deploy
10. **Monitoring & Scaling**: Setup logging, monitoring, scale as needed

---

Would you like me to start implementing any specific part? I recommend starting with:
1. Authentication (foundation for everything)
2. Patient symptom entry (core feature)
3. Doctor appointment management
4. Then connect with frontend

