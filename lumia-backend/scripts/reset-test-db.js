/**
 * Standalone Test Database Reset & Seed Script
 * Can be executed before test runs:
 *   node scripts/reset-test-db.js
 */
const { resetTestDb } = require('../tests/setup/testDb');

async function main() {
  console.log('🔄 Resetting and seeding test database...');
  try {
    const data = await resetTestDb();
    console.log('✅ Test database reset and seeded successfully.');
    console.log(`   Seeded Users: ${Object.keys(data.users).join(', ')}`);
    console.log(`   Seeded Doctors: ${Object.keys(data.doctors).join(', ')}`);
    console.log(`   Seeded Patients: ${Object.keys(data.patients).join(', ')}`);
    console.log(`   Seeded Appointments: ${Object.keys(data.appointments).join(', ')}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset test database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

