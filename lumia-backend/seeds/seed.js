require('dotenv').config({ path: '../.env' });
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Clear existing data safely
    logger.info('Clearing old data...');
    await db.query('TRUNCATE table dpdp_audit_logs, prescriptions, symptoms, appointments, clinics, doctors, patients, users CASCADE');
    
    // Insert Admin
    const adminPass = await bcrypt.hash('admin123', 10);
    const adminRes = await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['admin@lumia.com', adminPass, '+919999999990', 'admin', 'active']
    );
    const adminId = adminRes.rows[0].id;
    logger.info('Created Admin: admin@lumia.com / admin123');
    
    // Insert Doctors
    const doctorIds = [];
    const docSpecialties = ['General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedist', 'Pediatrician'];
    
    logger.info('Creating 5 mock doctors...');
    for (let i = 0; i < 5; i++) {
        const pass = await bcrypt.hash('doc123', 10);
        const email = `doctor${i+1}@lumia.com`;
        const phone = '+91' + faker.string.numeric(10);
        const userRes = await db.query(
           `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
           [email, pass, phone, 'doctor', 'active']
        );
        const userId = userRes.rows[0].id;
        
        const fName = faker.person.firstName();
        const lName = faker.person.lastName();
        const docRes = await db.query(
          `INSERT INTO doctors (user_id, first_name, last_name, name, specializations, mci_registration_number, consultation_fee, verification_status, mci_verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPROVED', 'verified') RETURNING id`,
          [userId, fName, lName, `${fName} ${lName}`, `{${docSpecialties[i]}}`, 'MCI' + faker.string.numeric(6), faker.number.int({min:500, max:1500})]
        );
        doctorIds.push(docRes.rows[0].id);
    }
    logger.info('Created 5 Doctors. Logins: doctor1@lumia.com to doctor5@lumia.com / doc123');

    // Insert Patients
    const patientIds = [];
    logger.info('Creating 20 mock patients...');
    for (let i = 0; i < 20; i++) {
        const pass = await bcrypt.hash('pat123', 10);
        const email = `patient${i+1}@lumia.com`;
        const phone = '+91' + faker.string.numeric(10);
        const userRes = await db.query(
           `INSERT INTO users (email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
           [email, pass, phone, 'patient', 'active']
        );
        const userId = userRes.rows[0].id;
        
        const fName = faker.person.firstName();
        const lName = faker.person.lastName();
        const patRes = await db.query(
          `INSERT INTO patients (user_id, first_name, last_name, name, dob, gender)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [userId, fName, lName, `${fName} ${lName}`, faker.date.birthdate({min: 10, max: 80, mode: 'age'}), faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER'])]
        );
        patientIds.push(patRes.rows[0].id);
    }
    logger.info('Created 20 Patients. Logins: patient1@lumia.com to patient20@lumia.com / pat123');

    // Insert Symptoms, Appointments & Prescriptions
    logger.info('Creating 40 mock appointments & test prescriptions...');
    for (let i = 0; i < 40; i++) {
       const patId = faker.helpers.arrayElement(patientIds);
       const docId = faker.helpers.arrayElement(doctorIds);
       const status = faker.helpers.arrayElement(['BOOKED', 'COMPLETED', 'CANCELLED']);
       const date = faker.date.recent();
       const fee = status === 'COMPLETED' ? faker.number.int({min:500, max:2000}) : null;
       
       const appRes = await db.query(
         `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, pre_visit_notes, fee)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
         [patId, docId, date, status, faker.lorem.sentence(), fee]
       );
       
       const appId = appRes.rows[0].id;
       
       // Log a symptom
       await db.query(
           `INSERT INTO symptoms (patient_id, appointment_id, raw_text, urgency, risk_score, extracted_conditions)
            VALUES ($1, $2, $3, $4, $5, $6)`,
           [patId, appId, faker.lorem.sentences(2), faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']), faker.number.int({min:20, max:90}), JSON.stringify({root_cause: 'fever'})]
       );

       if (status === 'COMPLETED') {
         // Create a prescription
         await db.query(
           `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, medications, ai_plain_language_summary, qr_verification_hash)
            VALUES ($1, $2, $3, $4, $5, $6)`,
           [appId, docId, patId, JSON.stringify([{name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily'}]), 'Take one pill after breakfast and one after dinner with water.', 'QRHASH_' + appId.substring(0,8)]
         );
       }
    }

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', { error: error.message });
    process.exit(1);
  }
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
