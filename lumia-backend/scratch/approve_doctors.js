const db = require('../config/db');
async function approve() {
    try {
        const res = await db.query(`
            UPDATE doctors 
            SET verification_status = 'APPROVED', 
                mci_verification_status = 'verified',
                specializations = COALESCE(specializations, ARRAY['General Physician']),
                name = COALESCE(name, first_name || ' ' || last_name)
            WHERE verification_status = 'PENDING' OR verification_status IS NULL
            RETURNING *
        `);
        console.log(`Approved ${res.rowCount} doctors.`);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
approve();
