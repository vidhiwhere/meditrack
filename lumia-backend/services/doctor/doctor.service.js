const db = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Get doctor's appointments
 */
const getAppointments = async (doctorId, status = null, limit = 20, offset = 0) => {
  try {
    let query = `
      SELECT a.id, a.patient_id, a.scheduled_at, a.status, a.pre_visit_notes,
             p.first_name, p.last_name, u.email, u.phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = $1
    `;
    const params = [doctorId];

    if (status) {
      query += ` AND a.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY a.scheduled_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM appointments WHERE doctor_id = $1`;
    let countParams = [doctorId];
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);

    return {
      appointments: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  } catch (error) {
    logger.error('Get appointments error', { error: error.message });
    throw error;
  }
};

/**
 * Update appointment status (completed, cancelled)
 */
const updateAppointmentStatus = async (appointmentId, status, fee) => {
  try {
    const result = await db.query(
      `UPDATE appointments SET status = $1, fee = $2 WHERE id = $3 RETURNING *`,
      [status, fee, appointmentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    logger.info('Appointment updated', { appointmentId, status });
    return result.rows[0];
  } catch (error) {
    logger.error('Update appointment error', { error: error.message });
    throw error;
  }
};

/**
 * Create prescription
 */
const createPrescription = async (appointmentId, medications, plainLanguageSummary) => {
  try {
    // Get appointment details to extract doctor and patient IDs
    const appointmentResult = await db.query(
      `SELECT doctor_id, patient_id FROM appointments WHERE id = $1`,
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const { doctor_id, patient_id } = appointmentResult.rows[0];

    // Generate QR verification hash
    const qrHash = generateQRHash(appointmentId);

    const result = await db.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, medications, ai_plain_language_summary, qr_verification_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, doctor_id, patient_id, medications, ai_plain_language_summary, qr_verification_hash, created_at`,
      [appointmentId, doctor_id, patient_id, JSON.stringify(medications), plainLanguageSummary, qrHash]
    );

    logger.info('Prescription created', { prescriptionId: result.rows[0].id, appointmentId });
    return result.rows[0];
  } catch (error) {
    logger.error('Create prescription error', { error: error.message });
    throw error;
  }
};

/**
 * Check drug interactions
 */
const checkDrugInteractions = async (medications) => {
  try {
    const interactions = [];
    const drugInteractionDatabase = getDrugInteractionDatabase();

    // Simple interaction checking - check all pairs
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i].name.toLowerCase();
        const drug2 = medications[j].name.toLowerCase();
        const key = `${drug1}|${drug2}`;
        const reverseKey = `${drug2}|${drug1}`;

        if (drugInteractionDatabase[key] || drugInteractionDatabase[reverseKey]) {
          interactions.push({
            drug1: medications[i].name,
            drug2: medications[j].name,
            severity: (drugInteractionDatabase[key] || drugInteractionDatabase[reverseKey]).severity,
            description: (drugInteractionDatabase[key] || drugInteractionDatabase[reverseKey]).description
          });
        }
      }
    }

    return {
      medications: medications.map(m => ({ name: m.name, dosage: m.dosage })),
      interactions,
      warningCount: interactions.filter(i => i.severity === 'HIGH').length,
      safeToDispense: interactions.length === 0
    };
  } catch (error) {
    logger.error('Check drug interactions error', { error: error.message });
    throw error;
  }
};

/**
 * Get doctor analytics
 */
const getAnalytics = async (doctorId) => {
  try {
    // Total appointments
    const appointmentCount = await db.query(
      `SELECT COUNT(*) FROM appointments WHERE doctor_id = $1`,
      [doctorId]
    );
    const totalAppointments = parseInt(appointmentCount.rows[0].count);

    // Completed appointments
    const completedCount = await db.query(
      `SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND status = 'COMPLETED'`,
      [doctorId]
    );
    const completedAppointments = parseInt(completedCount.rows[0].count);

    // Prescriptions issued
    const prescriptionCount = await db.query(
      `SELECT COUNT(*) FROM prescriptions WHERE doctor_id = $1`,
      [doctorId]
    );
    const prescriptionsIssued = parseInt(prescriptionCount.rows[0].count);

    // Average rating (mock)
    const avgRating = 4.5;

    // Patients seen (unique)
    const patientsResult = await db.query(
      `SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = $1`,
      [doctorId]
    );
    const patientsSeen = parseInt(patientsResult.rows[0].count);

    // Revenue calculation from fee column
    const revenueResult = await db.query(
      `SELECT SUM(fee) as total FROM appointments WHERE doctor_id = $1 AND status = 'COMPLETED'`,
      [doctorId]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

    return {
      totalAppointments,
      completedAppointments,
      prescriptionsIssued,
      patientsSeen,
      avgRating,
      totalRevenue,
      completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
    };
  } catch (error) {
    logger.error('Get analytics error', { error: error.message });
    throw error;
  }
};

/**
 * Helper: Generate QR verification hash
 */
function generateQRHash(appointmentId) {
  const timestamp = Date.now();
  return Buffer.from(`${appointmentId}:${timestamp}`).toString('base64');
}

/**
 * Helper: Drug interaction database
 */
function getDrugInteractionDatabase() {
  return {
    'aspirin|warfarin': {
      severity: 'HIGH',
      description: 'Increased risk of bleeding when combined'
    },
    'metformin|contrast dye': {
      severity: 'HIGH',
      description: 'Risk of kidney damage'
    },
    'lisinopril|potassium': {
      severity: 'MEDIUM',
      description: 'May increase potassium levels'
    },
    'ibuprofen|aspirin': {
      severity: 'MEDIUM',
      description: 'Increased GI side effects'
    },
    'simvastatin|grapefruit': {
      severity: 'MEDIUM',
      description: 'Reduces statin effectiveness'
    },
    'sertraline|tramadol': {
      severity: 'HIGH',
      description: 'Risk of serotonin syndrome'
    },
    'methotrexate|nsaid': {
      severity: 'HIGH',
      description: 'Increased kidney toxicity'
    },
    'digoxin|verapamil': {
      severity: 'HIGH',
      description: 'Increased digoxin toxicity'
    }
  };
}

/**
 * Get doctor's patients
 */
const getPatients = async (doctorId) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.dob, p.gender, u.email, u.phone,
              (SELECT MAX(scheduled_at) FROM appointments WHERE patient_id = p.id AND doctor_id = $1) as last_visit,
              (SELECT SUM(fee) FROM appointments WHERE patient_id = p.id AND doctor_id = $1 AND status = 'COMPLETED') as total_revenue
       FROM patients p
       JOIN users u ON p.user_id = u.id
       JOIN appointments a ON a.patient_id = p.id
       WHERE a.doctor_id = $1
       ORDER BY last_visit DESC`,
      [doctorId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Get patients error', { error: error.message });
    throw error;
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
