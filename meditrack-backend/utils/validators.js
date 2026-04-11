const { body, validationResult } = require('express-validator');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

const validateUUID = (id) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return re.test(id);
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateUUID,
};
