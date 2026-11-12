const { Pool } = require('pg');
require('dotenv').config();

const connectionUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

let poolConfig;

if (connectionUrl) {
  const isLocal = connectionUrl.includes('localhost') || 
                  connectionUrl.includes('127.0.0.1') || 
                  connectionUrl.includes('sslmode=disable') ||
                  process.env.DB_SSL === 'false';

  poolConfig = {
    connectionString: connectionUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  };
} else {
  poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
