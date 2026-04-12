const db = require('../config/db');

async function runDeployInit() {
    console.log('🚀 Starting Production Database Initialization...');

    try {
        // Run the main schema migration (001_init.sql handles everything)
        const fs = require('fs');
        const path = require('path');
        const mainSql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
        
        console.log('Running main schema migration (001_init.sql)...');
        try {
            await db.query(mainSql);
            console.log('✅ Schema ready.');
        } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log('⏭  Schema already applied, skipping.');
            } else {
                console.error('Schema migration error (non-fatal):', err.message);
                // Don't throw - tables might already exist from a previous run
            }
        }

        // Check if fee column exists in appointments (add if missing)
        try {
            await db.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2)`);
            console.log('✅ Fee column ensured.');
        } catch (err) {
            console.log('Fee column check skipped:', err.message);
        }

        // Check if seeding is needed
        let userCount = 0;
        try {
            const res = await db.query('SELECT COUNT(*) FROM users');
            userCount = parseInt(res.rows[0].count);
            console.log(`Found ${userCount} existing users.`);
        } catch (err) {
            console.log('Could not count users:', err.message);
        }

        if (userCount === 0) {
            console.log('Database is empty. Running seeders...');
            const { seedDatabase } = require('../seeds/seed');
            await seedDatabase();
            console.log('✅ Seeding completed successfully.');
        } else {
            console.log(`Database already has ${userCount} users. Skipping seeding.`);
        }

        console.log('🏁 Production initialization finished!');
    } catch (error) {
        // Log but don't crash the server
        console.error('⚠️  Initialization warning:', error.message);
    }
}

module.exports = { runDeployInit };

if (require.main === module) {
    runDeployInit()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
