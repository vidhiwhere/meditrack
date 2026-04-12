const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const logger = require('../utils/logger');

async function runDeployInit() {
    console.log('🚀 Starting Production Database Initialization...');

    // 1. Run Migrations
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
            await db.query(sql);
            console.log(`  ✅ ${file} done.`);
        } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log(`  ⏭  ${file} already applied, skipping.`);
            } else {
                console.error(`  ❌ ${file} failed:`, err.message);
                throw err;
            }
        }
    }

    // 2. Check if Seeding is needed
    let userCount = 0;
    try {
        const userCountRes = await db.query('SELECT COUNT(*) FROM users');
        userCount = parseInt(userCountRes.rows[0].count);
    } catch (err) {
        console.log('Could not count users, will proceed with seeding.');
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
}

module.exports = { runDeployInit };

// Allow standalone execution (e.g. for manual runs)
if (require.main === module) {
    runDeployInit()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
