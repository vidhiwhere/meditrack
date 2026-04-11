const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/patient.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.post('/symptoms', patientController.addSymptom);
router.get('/symptoms', patientController.getSymptoms);
router.get('/health-score', patientController.getHealthScore);
router.get('/timeline', patientController.getTimeline);
router.post('/family', patientController.addFamilyMember);
router.get('/family', patientController.getFamilyMembers);

module.exports = router;
