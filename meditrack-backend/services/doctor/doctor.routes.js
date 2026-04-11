const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/doctor.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.get('/appointments', doctorController.getAppointments);
router.put('/appointments/status', doctorController.updateAppointmentStatus);
router.post('/prescriptions', doctorController.createPrescription);
router.post('/drug-interactions', doctorController.checkDrugInteractions);
router.get('/analytics', doctorController.getAnalytics);

module.exports = router;
