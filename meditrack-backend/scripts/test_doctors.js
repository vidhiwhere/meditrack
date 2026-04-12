const db = require('../config/db');

async function main() {
  const result = await db.query(`
    SELECT d.id, d.specializations, d.first_name, d.last_name
    FROM doctors d
    WHERE d.verification_status = 'APPROVED'
  `);
  const doctors = result.rows.map(d => ({
    ...d,
    specialization: d.specializations && d.specializations.length > 0 ? d.specializations[0] : 'General Physician'
  }));
  console.log('Doctors count:', doctors.length);
  console.log(JSON.stringify(doctors, null, 2));
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
