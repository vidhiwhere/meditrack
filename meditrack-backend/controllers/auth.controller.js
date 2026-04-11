const authService = require('../services/auth/auth.service');
const tokenService = require('../services/auth/tokenService');
const logger = require('../utils/logger');
const { validateEmail, validatePassword, validatePhone } = require('../utils/validators');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, phone, password, confirmPassword, role, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !phone || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Confirm password matches
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Register user
    const newUser = await authService.registerUser(email, phone, password, role, firstName, lastName);

    logger.info('User registration successful', { userId: newUser.id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error) {
    logger.error('Registration controller error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Login user
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

    logger.info('User login successful', { userId: user.id, email });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user,
      accessToken,
      refreshToken, // Also return in body for flexibility
    });
  } catch (error) {
    logger.error('Login controller error', { error: error.message });
    res.status(401).json({ error: error.message });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    let token = req.body.refreshToken;

    // If not in body, try cookie
    if (!token) {
      token = req.cookies?.refreshToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Refresh token
    const { accessToken } = await tokenService.refreshAccessToken(token);

    logger.info('Token refreshed successfully');

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    logger.info('User logged out successfully');

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.getUserById(userId);

    res.json({
      user,
    });
  } catch (error) {
    logger.error('Get current user error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { language } = req.body;

    const updateData = {};
    if (language) updateData.language = language;

    const updatedUser = await authService.updateUserProfile(userId, updateData);

    logger.info('User profile updated', { userId });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get current user
    const db = require('../config/db');
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await authService.verifyPassword(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(newPassword);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    logger.info('Password changed successfully', { userId });

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};
