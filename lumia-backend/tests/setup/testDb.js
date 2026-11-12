const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
let db = require('../../config/db');

let isMemDb = false;
let memDbInstance = null;

async function setupTestDb() {
  const connectionUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  // If real Postgres connection URL is provided, test it
  if (connectionUrl) {
    try {
      await db.query('SELECT 1');
      const schemaSql = fs.readFileSync(path.join(__dirname, '../../migrations/001_init.sql'), 'utf8');
      await db.query(schemaSql).catch(() => {});
      await db.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2)').catch(() => {});
      return;
    } catch (err) {
      console.warn('Real database connection failed, falling back to pg-mem:', err.message);
    }
  }

  // Fallback to pg-mem in-memory PostgreSQL emulator
  if (!isMemDb) {
    const { newDb } = require('pg-mem');
    memDbInstance = newDb();

    memDbInstance.public.registerFunction({
      name: 'uuid_generate_v4',
      implementation: () => crypto.randomUUID(),
    });

    const schemaPath = path.join(__dirname, '../../migrations/001_init.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Remove unsupported extension statement and normalize decimal precision for pg-mem AST planner
    schemaSql = schemaSql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '');
    schemaSql = schemaSql.replace(/decimal\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'numeric');
    memDbInstance.public.none(schemaSql);
    try {
      memDbInstance.public.none('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee numeric;');
    } catch (_) {}

    const pgAdapter = memDbInstance.adapters.createPg();
    const memPool = new pgAdapter.Pool();

    // Patch the exported db pool methods so existing models/controllers use memPool
    db.query = (...args) => memPool.query(...args);
    db.connect = (...args) => memPool.connect(...args);
    isMemDb = true;
  }
}

async function resetTestDb() {
  await setupTestDb();

  // Clean all tables
  const tables = ['dpdp_audit_logs', 'prescriptions', 'symptoms', 'appointments', 'clinics', 'doctors', 'patients', 'users'];
  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table}`);
    } catch (err) {
      // Ignore if table doesn't exist
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHashAdmin = await bcrypt.hash('admin123', salt);
  const passwordHashDoc = await bcrypt.hash('doc123', salt);
  const passwordHashPat = await bcrypt.hash('pat123', salt);

  // 1. Admin
  const adminRes = await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'admin', 'active', true) RETURNING *`,
    [crypto.randomUUID(), 'admin@lumia.com', '+919999999901', passwordHashAdmin]
  );
  const admin = adminRes.rows[0];

  // 2. Doctor 1 (Approved)
  const doc1User = (await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'doctor', 'active', true) RETURNING *`,
    [crypto.randomUUID(), 'doctor1@lumia.com', '+919876543201', passwordHashDoc]
  )).rows[0];

  const doctor1 = (await db.query(
    `INSERT INTO doctors (id, user_id, first_name, last_name, name, specializations, mci_registration_number, consultation_fee, verification_status, mci_verification_status)
     VALUES ($1, $2, 'Priya', 'Sharma', 'Dr. Priya Sharma', ARRAY['General Physician'], 'MCI100001', 500.00, 'APPROVED', 'verified') RETURNING *`,
    [crypto.randomUUID(), doc1User.id]
  )).rows[0];

  // 3. Doctor 2 (Approved)
  const doc2User = (await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'doctor', 'active', true) RETURNING *`,
    [crypto.randomUUID(), 'doctor2@lumia.com', '+919876543202', passwordHashDoc]
  )).rows[0];

  const doctor2 = (await db.query(
    `INSERT INTO doctors (id, user_id, first_name, last_name, name, specializations, mci_registration_number, consultation_fee, verification_status, mci_verification_status)
     VALUES ($1, $2, 'Arjun', 'Mehta', 'Dr. Arjun Mehta', ARRAY['Cardiologist'], 'MCI100002', 1000.00, 'APPROVED', 'verified') RETURNING *`,
    [crypto.randomUUID(), doc2User.id]
  )).rows[0];

  // 4. Pending Doctor (Unverified)
  const pendingDocUser = (await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'doctor', 'pending', false) RETURNING *`,
    [crypto.randomUUID(), 'pendingdoc@lumia.com', '+919876543299', passwordHashDoc]
  )).rows[0];

  const pendingDoctor = (await db.query(
    `INSERT INTO doctors (id, user_id, first_name, last_name, name, specializations, mci_registration_number, consultation_fee, verification_status, mci_verification_status)
     VALUES ($1, $2, 'Rahul', 'Roy', 'Dr. Rahul Roy', ARRAY['Dermatologist'], 'MCI100099', 600.00, 'PENDING', 'PENDING') RETURNING *`,
    [crypto.randomUUID(), pendingDocUser.id]
  )).rows[0];

  // 5. Patient 1
  const pat1User = (await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'patient', 'active', true) RETURNING *`,
    [crypto.randomUUID(), 'patient1@lumia.com', '+919765432101', passwordHashPat]
  )).rows[0];

  const patient1 = (await db.query(
    `INSERT INTO patients (id, user_id, first_name, last_name, name, dob, gender)
     VALUES ($1, $2, 'Rohit', 'Verma', 'Rohit Verma', '1990-05-15', 'MALE') RETURNING *`,
    [crypto.randomUUID(), pat1User.id]
  )).rows[0];

  // 6. Patient 2
  const pat2User = (await db.query(
    `INSERT INTO users (id, email, phone, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, $4, 'patient', 'active', true) RETURNING *`,
    [crypto.randomUUID(), 'patient2@lumia.com', '+919765432102', passwordHashPat]
  )).rows[0];

  const patient2 = (await db.query(
    `INSERT INTO patients (id, user_id, first_name, last_name, name, dob, gender)
     VALUES ($1, $2, 'Kavya', 'Nair', 'Kavya Nair', '1995-08-22', 'FEMALE') RETURNING *`,
    [crypto.randomUUID(), pat2User.id]
  )).rows[0];

  // 7. Seed Sample Appointments
  // Future Booked Appointment for Patient 1 with Doctor 1
  const futureDate1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const apptBooked1 = (await db.query(
    `INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, status, pre_visit_notes)
     VALUES ($1, $2, $3, $4, 'BOOKED', 'Follow-up consultation') RETURNING *`,
    [crypto.randomUUID(), patient1.id, doctor1.id, futureDate1]
  )).rows[0];

  // Future Booked Appointment for Patient 2 with Doctor 2
  const futureDate2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const apptBooked2 = (await db.query(
    `INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, status, pre_visit_notes)
     VALUES ($1, $2, $3, $4, 'BOOKED', 'Cardio routine check') RETURNING *`,
    [crypto.randomUUID(), patient2.id, doctor2.id, futureDate2]
  )).rows[0];

  // Past Completed Appointment for Patient 1 with Doctor 1
  const pastDate1 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const apptCompleted1 = (await db.query(
    `INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, status, pre_visit_notes, fee)
     VALUES ($1, $2, $3, $4, 'COMPLETED', 'Initial consultation completed', 500.00) RETURNING *`,
    [crypto.randomUUID(), patient1.id, doctor1.id, pastDate1]
  )).rows[0];

  return {
    users: {
      admin: admin,
      doctor1: doc1User,
      doctor2: doc2User,
      pendingDoctor: pendingDocUser,
      patient1: pat1User,
      patient2: pat2User,
    },
    doctors: {
      doctor1,
      doctor2,
      pendingDoctor,
    },
    patients: {
      patient1,
      patient2,
    },
    appointments: {
      apptBooked1,
      apptBooked2,
      apptCompleted1,
    },
  };
}

module.exports = {
  setupTestDb,
  resetTestDb,
  getDb: () => db,
};
