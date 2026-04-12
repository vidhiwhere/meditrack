const db = require('../config/db');

async function main() {
  const res = await db.query("UPDATE doctors SET verification_status = 'APPROVED' WHERE verification_status = 'PENDING'");
  console.log('Approved doctors:', res.rowCount);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
