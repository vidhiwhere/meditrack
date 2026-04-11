// Notification Service - WhatsApp/SMS/Email notifications
const logger = require('../../utils/logger');

module.exports = {
  sendNotification: async (userId, message, type) => {
    // Mock sending notification
    logger.info(`[MOCK NOTIFICATION] Sent ${type} to User ${userId}: ${message}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  },
  sendAppointmentReminder: async (appointmentId, patientId, doctorId, time) => {
    // Send appointment reminder
    logger.info(`[MOCK NOTIFICATION] Reminder for Appointment ${appointmentId} to Patient ${patientId} with Doctor ${doctorId} at ${time}`);
    return { success: true, messageId: `mock_reminder_${appointmentId}` };
  },
  sendPrescriptionSummary: async (prescriptionId, patientId, qrHash) => {
    // Send prescription summary
    logger.info(`[MOCK NOTIFICATION] Prescription ${prescriptionId} sent to Patient ${patientId}. Link: /verify?hash=${qrHash}`);
    return { success: true, messageId: `mock_prescription_${prescriptionId}` };
  },
};
