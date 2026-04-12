const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} = require('../middleware/validation');

/**
 * Public Routes (No Authentication Required)
 */

// Register new user
router.post('/register', validateRegister, handleValidationErrors, authController.register);

// Login user
router.post('/login', validateLogin, handleValidationErrors, authController.login);

// Refresh access token
router.post('/refresh', authController.refreshToken);

/**
 * Protected Routes (Authentication Required)
 */

// Get current user profile
router.get('/me', verifyToken, authController.getCurrentUser);

// Update user profile
router.put('/profile', verifyToken, authController.updateProfile);

// Change password
router.post('/change-password', verifyToken, authController.changePassword);

// Logout user
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
