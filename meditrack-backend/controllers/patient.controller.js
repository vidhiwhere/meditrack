// Patient Controller
const patientService = require('../services/patient/patient.service');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Add symptom
 */
const addSymptom = async (req, res) => {
  try {
    const { rawText } = req.body;
    const userId = req.user.userId;

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Symptom description required' });
    }

    // Get patient record from user ID
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const patientId = patientResult.rows[0].id;
    const symptom = await patientService.addSymptom(patientId, rawText);
    res.status(201).json({
      message: 'Symptom recorded successfully',
      symptom
    });
  } catch (error) {
    logger.error('Add symptom error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get patient symptoms
 */
const getSymptoms = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get patient record from user ID
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const symptoms = await patientService.getSymptoms(patientResult.rows[0].id, limit, offset);
    res.json(symptoms);
  } catch (error) {
    logger.error('Get symptoms error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get health score
 */
const getHealthScore = async (req, res) => {
  try {
    const patientId = req.user.userId;

    // Get patient record
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const healthScore = await patientService.getHealthScore(patientResult.rows[0].id);
    res.json(healthScore);
  } catch (error) {
    logger.error('Get health score error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get timeline
 */
const getTimeline = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;

    // Get patient record
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const timeline = await patientService.getTimeline(patientResult.rows[0].id, limit);
    res.json(timeline);
  } catch (error) {
    logger.error('Get timeline error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add family member
 */
const addFamilyMember = async (req, res) => {
  try {
    const { firstName, lastName, dob, gender } = req.body;
    const patientId = req.user.userId;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name required' });
    }

    // Get patient record
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const familyMember = await patientService.addFamilyMember(
      patientResult.rows[0].id,
      firstName,
      lastName,
      dob,
      gender
    );

    res.status(201).json({
      message: 'Family member added successfully',
      familyMember
    });
  } catch (error) {
    logger.error('Add family member error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get family members
 */
const getFamilyMembers = async (req, res) => {
  try {
    const patientId = req.user.userId;

    // Get patient record
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE user_id = $1 LIMIT 1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const familyMembers = await patientService.getFamilyMembers(patientResult.rows[0].id);
    res.json({
      familyMembers,
      total: familyMembers.length
    });
  } catch (error) {
    logger.error('Get family members error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addSymptom,
  getSymptoms,
  getHealthScore,
  getTimeline,
  addFamilyMember,
  getFamilyMembers
};
