const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('../config/env');
const db = require('../config/db');

// Import Routes
const authRoutes = require('../services/auth/auth.routes');
const patientRoutes = require('../services/patient/patient.routes');
const doctorRoutes = require('../services/doctor/doctor.routes');
// const adminRoutes = require('../services/admin/admin.routes');
// const b2bRoutes = require('../services/b2b/b2b.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Health check and DB integration check
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({ status: 'OK', message: 'Lumia Backend is running.' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'DB Connection failed.' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/b2b', b2bRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

