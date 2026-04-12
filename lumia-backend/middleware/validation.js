const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Validation rules
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('role')
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage('Invalid role'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const validateAppointmentBooking = [
  body('doctor_id')
    .isUUID()
    .withMessage('Invalid doctor ID'),
  body('appointment_date')
    .isISO8601()
    .withMessage('Invalid appointment date'),
  body('consultation_type')
    .isIn(['online', 'offline'])
    .withMessage('Invalid consultation type'),
];

const validateSymptomEntry = [
  body('symptom_description')
    .isLength({ min: 10 })
    .withMessage('Symptom description must be at least 10 characters'),
  body('duration_days')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('severity')
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Invalid severity level'),
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New passwords do not match'),
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateAppointmentBooking,
  validateSymptomEntry,
  validateChangePassword,
};
