const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/book', appointmentController.bookAppointment);
router.get('/list', appointmentController.listAppointments);
router.get('/:id', appointmentController.getAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;
