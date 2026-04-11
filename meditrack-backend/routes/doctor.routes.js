const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/doctor/appointments
 * Get doctor's appointments (optionally filtered by status)
 */
router.get('/appointments', doctorController.getAppointments);

/**
 * PUT /api/doctor/appointments/:id/status
 * Update appointment status (completed, cancelled)
 */
router.put('/appointments/status', doctorController.updateAppointmentStatus);

/**
 * POST /api/doctor/prescriptions
 * Create prescription (with auto drug interaction checking)
 */
router.post('/prescriptions', doctorController.createPrescription);

/**
 * POST /api/doctor/drug-interactions
 * Check drug interactions for medications
 */
router.post('/drug-interactions', doctorController.checkDrugInteractions);

/**
 * GET /api/doctor/analytics
 * Get doctor analytics (appointments, revenue, ratings, etc.)
 */
router.get('/analytics', doctorController.getAnalytics);

module.exports = router;
