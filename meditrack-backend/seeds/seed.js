// Seed file to initialize database with sample data

const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // 1. Create sample users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const patientPassword = await bcrypt.hash('patient123', 10);

    // Admin user
    await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin@meditrack.com', adminPassword, '9999999999', 'admin', 'active']
    );

    // Doctor user
    const doctorResult = await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['doctor@meditrack.com', doctorPassword, '9999999998', 'doctor', 'active']
    );

    // Patient users
    const patientResult = await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['patient@meditrack.com', patientPassword, '9999999997', 'patient', 'active']
    );

    console.log('✓ Users seeded successfully');

    // 2. Create sample doctor profile
    await db.query(
      `INSERT INTO doctors (user_id, first_name, last_name, specialization, mci_registration_number, years_experience, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [doctorResult.rows[0].id, 'John', 'Doe', 'General Physician', 'MCI123456', 10, 500]
    );

    console.log('✓ Doctor profile seeded successfully');

    // 3. Create sample patient profile
    await db.query(
      `INSERT INTO patients (user_id, first_name, last_name, gender, blood_group, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [patientResult.rows[0].id, 'Jane', 'Smith', 'F', 'O+', '1990-05-15']
    );

    console.log('✓ Patient profile seeded successfully');

    console.log('\n✓ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
