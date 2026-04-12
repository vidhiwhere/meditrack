const db = require('./config/db');
(async () => {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'doctors'
        `);
        console.table(res.rows);
    } catch(e) { console.error(e); }
    process.exit(0);
})();
