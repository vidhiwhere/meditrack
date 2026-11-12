const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// ===== Middleware =====
app.use(helmet()); // Security headers
const ALLOWED_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  /\.vercel\.app$/, // Allow all Vercel subdomains
  /https?:\/\/.*render\.com/ // Allow Render subdomains
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL encoded
app.use(cookieParser()); // Parse cookies

// Database connection
const db = require('./config/db');

// ===== Routes =====
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patient', require('./routes/patient.routes'));
app.use('/api/doctor', require('./routes/doctor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/appointment', require('./routes/appointment.routes'));
app.use('/api/prescription', require('./routes/prescription.routes'));
app.use('/api/symptom', require('./routes/symptom.routes'));
app.use('/api/clinic', require('./routes/clinic.routes'));
app.use('/api/notification', require('./routes/notification.routes'));

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ===== Error Handler (must be last) =====
app.use(errorHandler);

// ===== Start Server =====
const PORT = env.PORT || 3000;

async function startServer() {
  try {
    // Test DB connection
    await db.query('SELECT NOW()');
    logger.info('✅ Database connected successfully');

    // Run migrations + seed in production
    if (process.env.DATABASE_URL) {
      const { runDeployInit } = require('./scripts/deploy-init');
      await runDeployInit();
    }
  } catch (err) {
    logger.error('Startup initialization failed', { error: err.message });
    // Don't crash - let the server start anyway for health checks
  }

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, { port: PORT, env: env.NODE_ENV });
    console.log(`
  ╔════════════════════════════════════╗
  ║       Lumia Backend Server         ║
  ║     Port: ${PORT}                        ║
  ╚════════════════════════════════════╝
    `);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
