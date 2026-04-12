const db = require('../config/db');
async function check() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments'");
    console.table(res.rows);
    process.exit(0);
}
check();
