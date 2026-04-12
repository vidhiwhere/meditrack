const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const logger = require('../utils/logger');

async function runDeployInit() {
    try {
        logger.info('🚀 Starting Production Database Initialization...');

        // 1. Run Migrations
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            logger.info(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            try {
                await db.query(sql);
            } catch (err) {
                // If the error is "already exists", we can ignore it for a simplified migrator
                if (err.message.includes('already exists')) {
                    logger.info(`Table/Relation in ${file} already exists, skipping...`);
                } else {
                    throw err;
                }
            }
        }

        // 2. Check if Seeding is needed
        const userCountRes = await db.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(userCountRes.rows[0].count);

        if (userCount === 0) {
            logger.info('Database is empty. Running seeders...');
            // We'll require and run the seed script logic
            // Note: Since we are in the scripts folder, we go up to the root to find seeds
            const { seedDatabase } = require('../seeds/seed');
            await seedDatabase();
            logger.info('✅ Seeding completed successfully.');
        } else {
            logger.info('Database already contains data. Skipping seeding.');
        }

        logger.info('🏁 Production initialization finished!');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Initialization failed', { error: error.message });
        console.error(error);
        process.exit(1);
    }
}

runDeployInit();
