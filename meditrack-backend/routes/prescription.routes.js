const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public verification route
router.get('/verify/:hash', prescriptionController.verifyPrescription);

router.use(verifyToken);

router.post('/create', prescriptionController.createPrescription);
router.get('/', prescriptionController.listPrescriptions);
router.get('/list', prescriptionController.listPrescriptions);
router.get('/:id', prescriptionController.getPrescription);
router.put('/:id', prescriptionController.updatePrescription);

module.exports = router;
