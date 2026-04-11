module.exports = {
  // User Roles
  ROLES: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    ADMIN: 'admin',
    CLINIC_OWNER: 'clinic_owner',
  },

  // User Status
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING_APPROVAL: 'pending_approval',
    SUSPENDED: 'suspended',
  },

  // Appointment Status
  APPOINTMENT_STATUS: {
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
    NO_SHOW: 'no_show',
  },

  // Consultation Type
  CONSULTATION_TYPE: {
    ONLINE: 'online',
    OFFLINE: 'offline',
  },

  // Symptom Severity
  SEVERITY: {
    MILD: 'mild',
    MODERATE: 'moderate',
    SEVERE: 'severe',
  },

  // Prescription Status
  PRESCRIPTION_STATUS: {
    ISSUED: 'issued',
    DISPENSED: 'dispensed',
    EXPIRED: 'expired',
  },

  // Lab Test Status
  LAB_TEST_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Consent Types
  CONSENT_TYPES: {
    DATA_PROCESSING: 'data_processing',
    MARKETING: 'marketing',
    HEALTH_SHARING: 'health_sharing',
  },

  // Languages
  LANGUAGES: {
    ENGLISH: 'en',
    HINDI: 'hi',
    PUNJABI: 'pa',
    TAMIL: 'ta',
    TELUGU: 'te',
    KANNADA: 'kn',
    MARATHI: 'mr',
    GUJARATI: 'gu',
  },

  // Token Expiry
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
  },
};
