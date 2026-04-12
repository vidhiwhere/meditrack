const db = require('../config/db');

async function main() {
  // Find the logged-in doctor user
  const userRes = await db.query("SELECT id, email FROM users WHERE email = 'vidhikumari6025@gmail.com'");
  console.log('User:', JSON.stringify(userRes.rows));

  if (userRes.rows.length === 0) { console.log('User not found!'); process.exit(0); }
  const userId = userRes.rows[0].id;

  // Find doctor record linked to this user
  const docRes = await db.query('SELECT id, first_name, last_name FROM doctors WHERE user_id = $1', [userId]);
  console.log('Doctor record:', JSON.stringify(docRes.rows));

  if (docRes.rows.length === 0) { console.log('No doctor record linked to this user!'); process.exit(0); }
  const doctorId = docRes.rows[0].id;

  // Find appointments for this doctor
  const apptRes = await db.query('SELECT id, patient_id, doctor_id, status, scheduled_at FROM appointments WHERE doctor_id = $1', [doctorId]);
  console.log('Appointments for this doctor:', apptRes.rows.length);
  console.log(JSON.stringify(apptRes.rows, null, 2));

  // Also show all appointments in the system 
  const allAppts = await db.query('SELECT id, doctor_id, patient_id, status, scheduled_at FROM appointments ORDER BY created_at DESC LIMIT 5');
  console.log('\nAll recent appointments:', JSON.stringify(allAppts.rows, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
