const fs = require('fs');
const path = require('path');

// Ensure env is loaded
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const db = require('../config/db');
const logger = require('../utils/logger');

async function runDeployInit() {
    console.log('🚀 Starting Production Database Initialization...');
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    try {
        // 1. Test DB connection first
        await db.query('SELECT 1');
        console.log('✅ Database connection successful.');

        // 2. Run Migrations
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

        // 3. Check if Seeding is needed
        let userCount = 0;
        try {
            const userCountRes = await db.query('SELECT COUNT(*) FROM users');
            userCount = parseInt(userCountRes.rows[0].count);
        } catch (err) {
            console.log('users table not ready yet, will seed.');
        }

        if (userCount === 0) {
            console.log('Database is empty. Running seeders...');
            const { seedDatabase } = require('../seeds/seed');
            await seedDatabase();
            console.log('✅ Seeding completed successfully.');
        } else {
            console.log(`Database has ${userCount} users. Skipping seeding.`);
        }

        console.log('🏁 Production initialization finished!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runDeployInit();
