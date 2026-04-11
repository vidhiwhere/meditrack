const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  await client.connect();
  console.log('Redis connected');
})();

module.exports = client;
