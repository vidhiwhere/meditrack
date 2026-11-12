// Doctor Controller
const doctorService = require('../services/doctor/doctor.service');
const db = require('../config/db');
const logger = require('../utils/logger');
const notificationService = require('../services/notification/notification.service');

/**
 * Get doctor's appointments
 */
const getAppointments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = req.query.status || null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get doctor record
    const doctorResult = await db.query(
      'SELECT id FROM doctors WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized as a doctor' });
    }

    const doctorId = doctorResult.rows[0].id;
    const appointments = await doctorService.getAppointments(doctorId, status, limit, offset);
    res.json(appointments);
  } catch (error) {
    logger.error('Get appointments error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status, fee } = req.body;
    const userId = req.user.userId;
    
    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Appointment ID and status required' });
    }

    // Get doctor record for current user
    const doctorResult = await db.query(
      'SELECT id FROM doctors WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized as a doctor' });
    }

    const doctorId = doctorResult.rows[0].id;

    // Verify appointment exists
    const appointmentResult = await db.query(
      'SELECT id, doctor_id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify doctor owns this appointment
    if (appointmentResult.rows[0].doctor_id !== doctorId) {
      return res.status(403).json({ error: 'Forbidden: Cannot update another doctor\'s appointment' });
    }

    let parsedFee = null;
    if (status === 'COMPLETED') {
      // Check if already completed
      if (appointmentResult.rows[0].status === 'COMPLETED') {
        return res.status(400).json({ error: 'Appointment has already been completed' });
      }

      // Validate fee boundaries
      if (fee !== undefined && fee !== null && fee !== '') {
        const num = Number(fee);
        if (isNaN(num) || typeof fee === 'boolean') {
          return res.status(400).json({ error: 'Consultation fee must be a valid number' });
        }
        if (num < 0) {
          return res.status(400).json({ error: 'Consultation fee cannot be negative' });
        }
        if (num > 1000000) {
          return res.status(400).json({ error: 'Consultation fee exceeds allowable limit' });
        }
        parsedFee = num;
      } else {
        parsedFee = 0; // Fee of 0 is acceptable
      }
    }

    const updated = await doctorService.updateAppointmentStatus(appointmentId, status, parsedFee);
    res.json({
      message: 'Appointment status updated',
      appointment: updated
    });
  } catch (error) {
    logger.error('Update appointment status error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create prescription
 */
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medications, plainLanguageSummary } = req.body;

    if (!appointmentId || !medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Appointment ID and medications array required' });
    }

    // Check drug interactions
    const interactions = await doctorService.checkDrugInteractions(medications);

    if (!interactions.safeToDispense) {
      return res.status(400).json({
        error: 'Drug interactions detected',
        interactions: interactions.interactions,
        warningCount: interactions.warningCount
      });
    }

    const prescription = await doctorService.createPrescription(
      appointmentId,
      medications,
      plainLanguageSummary || 'Take as prescribed'
    );

    // Send WhatsApp Notification to Patient
    try {
      await notificationService.sendPrescriptionSummary(
        prescription.id, 
        prescription.patient_id, 
        prescription.qr_verification_hash
      );
    } catch (notifErr) {
      logger.warn('Failed to send WhatsApp prescription summary', { error: notifErr.message });
      // We do not fail the request if notification fails.
    }

    res.status(201).json({
      message: 'Prescription created',
      prescription
    });
  } catch (error) {
    logger.error('Create prescription error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check drug interactions
 */
const checkDrugInteractions = async (req, res) => {
  try {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Medications array required' });
    }

    const interactions = await doctorService.checkDrugInteractions(medications);
    res.json(interactions);
  } catch (error) {
    logger.error('Check drug interactions error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get doctor analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get doctor record
    const doctorResult = await db.query(
      'SELECT id FROM doctors WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized as a doctor' });
    }

    const doctorId = doctorResult.rows[0].id;
    const analytics = await doctorService.getAnalytics(doctorId);
    res.json(analytics);
  } catch (error) {
    logger.error('Get analytics error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get doctor's patients
 */
const getPatients = async (req, res) => {
  try {
    const userId = req.user.userId;

    const doctorResult = await db.query(
      'SELECT id FROM doctors WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized as a doctor' });
    }

    const doctorId = doctorResult.rows[0].id;
    const patients = await doctorService.getPatients(doctorId);
    res.json(patients);
  } catch (error) {
    logger.error('Get patients error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAppointments,
  updateAppointmentStatus,
  createPrescription,
  checkDrugInteractions,
  getAnalytics,
  getPatients
};
