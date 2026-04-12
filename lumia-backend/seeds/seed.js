if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../utils/logger');

// Static seed data - no faker dependency needed in production
const DOCTORS = [
  { email: 'doctor1@lumia.com', firstName: 'Priya', lastName: 'Sharma', specialty: 'General Physician', mci: 'MCI100001', fee: 700 },
  { email: 'doctor2@lumia.com', firstName: 'Arjun', lastName: 'Mehta', specialty: 'Cardiologist', mci: 'MCI100002', fee: 1200 },
  { email: 'doctor3@lumia.com', firstName: 'Sneha', lastName: 'Kapoor', specialty: 'Dermatologist', mci: 'MCI100003', fee: 900 },
  { email: 'doctor4@lumia.com', firstName: 'Rajesh', lastName: 'Gupta', specialty: 'Orthopedist', mci: 'MCI100004', fee: 1000 },
  { email: 'doctor5@lumia.com', firstName: 'Ananya', lastName: 'Singh', specialty: 'Pediatrician', mci: 'MCI100005', fee: 800 },
];

const PATIENTS = [
  { email: 'patient1@lumia.com', firstName: 'Rohit', lastName: 'Verma', gender: 'MALE', dob: '1990-05-15' },
  { email: 'patient2@lumia.com', firstName: 'Kavya', lastName: 'Nair', gender: 'FEMALE', dob: '1995-08-22' },
  { email: 'patient3@lumia.com', firstName: 'Vikram', lastName: 'Joshi', gender: 'MALE', dob: '1988-03-10' },
  { email: 'patient4@lumia.com', firstName: 'Pooja', lastName: 'Patel', gender: 'FEMALE', dob: '1992-11-30' },
  { email: 'patient5@lumia.com', firstName: 'Amir', lastName: 'Khan', gender: 'MALE', dob: '1985-07-08' },
  { email: 'patient6@lumia.com', firstName: 'Sunita', lastName: 'Reddy', gender: 'FEMALE', dob: '2000-01-18' },
  { email: 'patient7@lumia.com', firstName: 'Deepak', lastName: 'Sharma', gender: 'MALE', dob: '1978-09-25' },
  { email: 'patient8@lumia.com', firstName: 'Meena', lastName: 'Iyer', gender: 'FEMALE', dob: '1998-04-12' },
  { email: 'patient9@lumia.com', firstName: 'Suresh', lastName: 'Kumar', gender: 'MALE', dob: '1982-06-03' },
  { email: 'patient10@lumia.com', firstName: 'Lakshmi', lastName: 'Prasad', gender: 'FEMALE', dob: '1993-12-20' },
];

const APPOINTMENT_STATUSES = ['BOOKED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'BOOKED'];
const SYMPTOMS = [
  'Patient complains of persistent headache and mild fever for 3 days.',
  'Chest pain when climbing stairs, shortness of breath.',
  'Skin rash on arms and neck, itching since last week.',
  'Knee pain while walking, swelling noticed after exercise.',
  'Child has high fever and sore throat for 2 days.',
  'Severe back pain, difficulty in sitting for long hours.',
  'Recurring stomach ache and nausea after meals.',
  'Fatigue, weight loss, and excessive thirst.',
];

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Clear existing data safely
    logger.info('Clearing old data...');
    await db.query('TRUNCATE TABLE dpdp_audit_logs, prescriptions, symptoms, appointments, clinics, doctors, patients, users CASCADE');
    
    // Insert Admin
    const adminPass = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5)`,
      ['admin@lumia.com', adminPass, '+919999999990', 'admin', 'active']
    );
    logger.info('Created Admin: admin@lumia.com / admin123');
    
    // Insert Doctors
    const doctorIds = [];
    logger.info('Creating 5 doctors...');
    for (let i = 0; i < DOCTORS.length; i++) {
      const doc = DOCTORS[i];
      const pass = await bcrypt.hash('doc123', 10);
      const phone = `+9198765432${String(i).padStart(2, '0')}`;
      const userRes = await db.query(
        `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [doc.email, pass, phone, 'doctor', 'active']
      );
      const userId = userRes.rows[0].id;
      
      const docRes = await db.query(
        `INSERT INTO doctors (user_id, first_name, last_name, name, specializations, mci_registration_number, consultation_fee, verification_status, mci_verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPROVED', 'verified') RETURNING id`,
        [userId, doc.firstName, doc.lastName, `Dr. ${doc.firstName} ${doc.lastName}`, `{${doc.specialty}}`, doc.mci, doc.fee]
      );
      doctorIds.push(docRes.rows[0].id);
    }
    logger.info('Created 5 Doctors. Logins: doctor1@lumia.com to doctor5@lumia.com / doc123');

    // Insert Patients
    const patientIds = [];
    logger.info('Creating 10 patients...');
    for (let i = 0; i < PATIENTS.length; i++) {
      const pat = PATIENTS[i];
      const pass = await bcrypt.hash('pat123', 10);
      const phone = `+9197654321${String(i).padStart(2, '0')}`;
      const userRes = await db.query(
        `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [pat.email, pass, phone, 'patient', 'active']
      );
      const userId = userRes.rows[0].id;
      
      const patRes = await db.query(
        `INSERT INTO patients (user_id, first_name, last_name, name, dob, gender)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, pat.firstName, pat.lastName, `${pat.firstName} ${pat.lastName}`, pat.dob, pat.gender]
      );
      patientIds.push(patRes.rows[0].id);
    }
    logger.info('Created 10 Patients. Logins: patient1@lumia.com to patient10@lumia.com / pat123');

    // Insert Appointments
    logger.info('Creating 30 mock appointments...');
    const baseDate = new Date();
    for (let i = 0; i < 30; i++) {
      const patId = patientIds[i % patientIds.length];
      const docId = doctorIds[i % doctorIds.length];
      const status = APPOINTMENT_STATUSES[i % APPOINTMENT_STATUSES.length];
      const date = new Date(baseDate - (i * 24 * 60 * 60 * 1000)); // one per day back
      const fee = status === 'COMPLETED' ? 500 + (i * 50 % 1500) : null;
      const symptomText = SYMPTOMS[i % SYMPTOMS.length];
      
      const appRes = await db.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, pre_visit_notes, fee)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [patId, docId, date, status, symptomText, fee]
      );
      const appId = appRes.rows[0].id;
      
      // Insert symptom
      await db.query(
        `INSERT INTO symptoms (patient_id, appointment_id, raw_text, urgency, risk_score, extracted_conditions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [patId, appId, symptomText, ['LOW', 'MEDIUM', 'HIGH'][i % 3], 20 + (i * 3 % 70), JSON.stringify({ root_cause: 'fever' })]
      );

      if (status === 'COMPLETED') {
        await db.query(
          `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, medications, ai_plain_language_summary, qr_verification_hash)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [appId, docId, patId, JSON.stringify([{ name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily' }]), 'Take one tablet after meals with water for 5 days.', `QR${appId.substring(0, 8).toUpperCase()}`]
        );
      }
    }

    logger.info('✅ Database seeded successfully!');
    logger.info('Demo Accounts:');
    logger.info('  Admin:   admin@lumia.com / admin123');
    logger.info('  Doctor:  doctor1@lumia.com / doc123');
    logger.info('  Patient: patient1@lumia.com / pat123');
  } catch (error) {
    logger.error('Seeding failed', { error: error.message });
    throw error;
  }
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
