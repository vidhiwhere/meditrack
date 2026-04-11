// Doctor Controller
const doctorService = require('../services/doctor/doctor.service');
const db = require('../config/db');
const logger = require('../utils/logger');

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
    const { appointmentId, status } = req.body;
    
    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Appointment ID and status required' });
    }

    // Verify doctor owns this appointment
    const appointmentResult = await db.query(
      'SELECT doctor_id FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await doctorService.updateAppointmentStatus(appointmentId, status);
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

module.exports = {
  getAppointments,
  updateAppointmentStatus,
  createPrescription,
  checkDrugInteractions,
  getAnalytics
};
