const db = require('../config/db');
async function check() {
    const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors'");
    console.table(res.rows);
    const docRes = await db.query("SELECT * FROM doctors LIMIT 5");
    console.log('Doctors data:');
    console.table(docRes.rows);
    process.exit(0);
}
check();
