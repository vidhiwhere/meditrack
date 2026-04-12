// Notification Service - Real Twilio (with safe mock fallback)
const logger = require('../../utils/logger');
const env = require('../../config/env');
const db = require('../../config/db');

let twilioClient;
try {
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    const twilio = require('twilio');
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized');
  } else {
    logger.warn('Twilio credentials missing or invalid — using mock notification mode');
  }
} catch (err) {
  logger.warn('Twilio init failed — mock mode active', { error: err.message });
}

const sendTwilioMessage = async (toPhone, message, type = 'sms') => {
  if (!twilioClient) {
    logger.info(`[MOCK NOTIFICATION] [${type.toUpperCase()}] To: ${toPhone} | Msg: ${message}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  try {
    let formattedPhone = toPhone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    const from = type === 'whatsapp'
      ? `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`
      : env.TWILIO_PHONE_NUMBER;
    const to = type === 'whatsapp'
      ? `whatsapp:${formattedPhone}`
      : formattedPhone;

    const result = await twilioClient.messages.create({ body: message, from, to });
    logger.info(`Sent ${type} to ${formattedPhone}`, { sid: result.sid });
    return { success: true, messageId: result.sid };
  } catch (error) {
    logger.error(`Failed to send ${type}`, { error: error.message });
    throw error;
  }
};

const getPatientPhone = async (patientId) => {
  const result = await db.query(
    `SELECT u.phone FROM users u JOIN patients p ON u.id = p.user_id WHERE p.id = $1`,
    [patientId]
  );
  return result.rows.length > 0 ? result.rows[0].phone : null;
};

module.exports = {
  sendNotification: async (userId, message, type = 'sms') => {
    const result = await db.query('SELECT phone FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return { success: false, error: 'User not found' };
    return sendTwilioMessage(result.rows[0].phone, message, type);
  },

  sendAppointmentReminder: async (appointmentId, patientId, doctorId, time) => {
    const phone = await getPatientPhone(patientId);
    if (!phone) return { success: false, error: 'Patient phone not found' };
    const message = `Lumia: Reminder! You have an appointment at ${time}. Please arrive 10 mins early.`;
    return sendTwilioMessage(phone, message, 'whatsapp');
  },

  sendPrescriptionSummary: async (prescriptionId, patientId, qrHash) => {
    const phone = await getPatientPhone(patientId);
    if (!phone) return { success: false, error: 'Patient phone not found' };
    const message = `Lumia: Your digital prescription is ready. Verify here: ${env.CORS_ORIGIN}/verify-prescription?hash=${qrHash}`;
    return sendTwilioMessage(phone, message, 'whatsapp');
  },
};

