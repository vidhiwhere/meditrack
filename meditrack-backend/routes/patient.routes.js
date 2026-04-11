const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/patient/symptoms
 * Add a new symptom
 */
router.post('/symptoms', patientController.addSymptom);

/**
 * GET /api/patient/symptoms
 * Get patient symptoms with pagination
 */
router.get('/symptoms', patientController.getSymptoms);

/**
 * GET /api/patient/timeline
 * Get patient timeline (chronological order of symptoms)
 */
router.get('/timeline', patientController.getTimeline);

/**
 * GET /api/patient/health-score
 * Get calculated health score (0-100)
 */
router.get('/health-score', patientController.getHealthScore);

/**
 * POST /api/patient/family
 * Add family member
 */
router.post('/family', patientController.addFamilyMember);

/**
 * GET /api/patient/family
 * Get family members
 */
router.get('/family', patientController.getFamilyMembers);

module.exports = router;
