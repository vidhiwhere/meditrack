const db = require('../config/db');
async function check() {
    const res = await db.query("SELECT * FROM doctors WHERE first_name ILIKE '%Vidhi%' OR last_name ILIKE '%Vidhi%' OR name ILIKE '%Vidhi%'");
    console.log('Search results for Vidhi:');
    console.table(res.rows);
    process.exit(0);
}
check();
