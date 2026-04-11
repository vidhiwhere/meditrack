const db = require('../../config/db');
const logger = require('../../utils/logger');
const symptomAnalyzer = require('../ai/symptomAnalyzer.service');
const healthRiskService = require('../ai/healthRisk.service');

/**
 * Add symptom for patient
 */
const addSymptom = async (patientId, rawText) => {
  try {
    const analysis = await symptomAnalyzer.analyzeSymptom(rawText);

    const result = await db.query(
      `INSERT INTO symptoms (patient_id, raw_text, extracted_conditions, urgency, doctor_type_recommendation, risk_score, timeline_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, patient_id, raw_text, extracted_conditions, urgency, doctor_type_recommendation, risk_score, timeline_date`,
      [patientId, rawText, JSON.stringify(analysis.conditions), analysis.urgency, analysis.recommendedDoctorType, analysis.risk_score]
    );

    logger.info('Symptom added', { patientId, symptomId: result.rows[0].id });
    return result.rows[0];
  } catch (error) {
    logger.error('Add symptom error', { error: error.message });
    throw error;
  }
};

/**
 * Get patient symptoms with pagination
 */
const getSymptoms = async (patientId, limit = 10, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT id, patient_id, raw_text, extracted_conditions, urgency, doctor_type_recommendation, risk_score, timeline_date
       FROM symptoms
       WHERE patient_id = $1
       ORDER BY timeline_date DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM symptoms WHERE patient_id = $1',
      [patientId]
    );

    return {
      symptoms: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  } catch (error) {
    logger.error('Get symptoms error', { error: error.message });
    throw error;
  }
};

/**
 * Calculate health score (0-100)
 */
const getHealthScore = async (patientId) => {
  try {
    // Get recent symptoms (last 30 days)
    const symptomsResult = await db.query(
      `SELECT risk_score, urgency FROM symptoms
       WHERE patient_id = $1 AND timeline_date > NOW() - INTERVAL '30 days'
       ORDER BY timeline_date DESC`,
      [patientId]
    );

    const symptoms = symptomsResult.rows;

    if (symptoms.length === 0) {
      return {
        score: 100,
        status: 'Excellent',
        message: 'No recent health concerns',
        riskFactors: [],
        recommendations: ['Continue maintaining good health habits', 'Regular check-ups recommended']
      };
    }

    // Use the AI Service to calculate the health risk score
    const healthRiskAnalysis = await healthRiskService.calculateHealthRiskScore(patientId, symptoms);

    return {
      score: healthRiskAnalysis.score,
      status: healthRiskAnalysis.status,
      message: healthRiskAnalysis.message,
      riskFactors: healthRiskAnalysis.riskFactors,
      recommendations: healthRiskAnalysis.recommendations,
      lastUpdated: new Date(),
      symptomCount: symptoms.length
    };
  } catch (error) {
    logger.error('Get health score error', { error: error.message });
    throw error;
  }
};

/**
 * Get patient timeline of symptoms and events
 */
const getTimeline = async (patientId, limit = 20) => {
  try {
    const result = await db.query(
      `SELECT 
        id, 
        raw_text as description,
        urgency,
        doctor_type_recommendation as recommendedSpecialist,
        risk_score,
        timeline_date as date,
        'symptom' as eventType
       FROM symptoms
       WHERE patient_id = $1
       ORDER BY timeline_date DESC
       LIMIT $2`,
      [patientId, limit]
    );

    return {
      events: result.rows.map(row => ({
        ...row,
        date: new Date(row.date).toLocaleString()
      })),
      total: result.rows.length
    };
  } catch (error) {
    logger.error('Get timeline error', { error: error.message });
    throw error;
  }
};

/**
 * Add family member to patient account
 */
const addFamilyMember = async (patientId, firstName, lastName, dob, gender, relationship) => {
  try {
    const result = await db.query(
      `INSERT INTO patients (user_id, family_head_id, first_name, last_name, dob, gender)
       VALUES ((SELECT user_id FROM patients WHERE id = $1), $1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, dob, gender`,
      [patientId, firstName, lastName, dob, gender]
    );

    logger.info('Family member added', { patientId, memberId: result.rows[0].id });
    return result.rows[0];
  } catch (error) {
    logger.error('Add family member error', { error: error.message });
    throw error;
  }
};

/**
 * Get family members
 */
const getFamilyMembers = async (patientId) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, dob, gender, preferred_language
       FROM patients
       WHERE family_head_id = $1`,
      [patientId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get family members error', { error: error.message });
    throw error;
  }
};

/**
 * Helper: Calculate urgency level
 */
function calculateUrgency(text) {
  const emergencyKeywords = ['emergency', 'chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'poisoning'];
  const highKeywords = ['severe', 'intense', 'critical', 'sudden', 'fracture', 'burn', 'poisoned'];
  const mediumKeywords = ['moderate', 'mild', 'pain', 'discomfort', 'fever', 'headache'];

  const lowerText = text.toLowerCase();

  if (emergencyKeywords.some(k => lowerText.includes(k))) {
    return { level: 'EMERGENCY', score: 90 };
  }
  if (highKeywords.some(k => lowerText.includes(k))) {
    return { level: 'HIGH', score: 70 };
  }
  if (mediumKeywords.some(k => lowerText.includes(k))) {
    return { level: 'MEDIUM', score: 40 };
  }
  return { level: 'LOW', score: 10 };
}

/**
 * Helper: Extract conditions from text
 */
function extractConditions(text) {
  const conditionKeywords = {
    'fever': ['fever', 'temperature', 'hot', 'chills'],
    'cough': ['cough', 'coughing', 'throat', 'respiratory'],
    'headache': ['headache', 'migraine', 'head pain', 'throbbing'],
    'body_ache': ['body ache', 'pain', 'soreness', 'muscle pain'],
    'nausea': ['nausea', 'vomiting', 'sick', 'stomach'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'weak'],
    'allergies': ['allergy', 'allergic', 'rash', 'itching']
  };

  const found = {};
  const lowerText = text.toLowerCase();

  Object.entries(conditionKeywords).forEach(([condition, keywords]) => {
    if (keywords.some(k => lowerText.includes(k))) {
      found[condition] = true;
    }
  });

  return found;
}

/**
 * Helper: Recommend doctor specialty
 */
function recommendDoctorType(conditions) {
  const conditionToDoctorMap = {
    'fever': 'General Physician',
    'cough': 'Pulmonologist',
    'headache': 'Neurologist',
    'body_ache': 'Orthopedist',
    'nausea': 'Gastroenterologist',
    'fatigue': 'General Physician',
    'allergies': 'Allergist'
  };

  const doctors = Object.entries(conditions)
    .filter(([_, found]) => found)
    .map(([cond]) => conditionToDoctorMap[cond]);

  return doctors[0] || 'General Physician';
}

/**
 * Helper: Generate recommendations
 */
function generateRecommendations(score, symptoms) {
  const recommendations = [];

  if (score < 40) {
    recommendations.push('Schedule an appointment with a doctor immediately');
    recommendations.push('Avoid strenuous activities');
  }
  if (score < 60) {
    recommendations.push('Schedule a check-up with your doctor');
    recommendations.push('Get adequate rest and hydration');
  }
  if (score >= 80) {
    recommendations.push('Continue with your current health habits');
    recommendations.push('Regular check-ups every 6 months');
  }

  recommendations.push('Maintain a healthy diet and exercise routine');

  return recommendations;
}

module.exports = {
  addSymptom,
  getSymptoms,
  getHealthScore,
  getTimeline,
  addFamilyMember,
  getFamilyMembers
};
