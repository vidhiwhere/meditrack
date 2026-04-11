const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Generate access and refresh tokens
 */
const generateTokens = async (userId, role) => {
  try {
    // Generate access token
    const accessToken = jwt.sign(
      {
        userId,
        role,
        type: 'access',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY || '15m' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId,
        type: 'refresh',
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY || '7d' }
    );

    logger.info('Tokens generated successfully', { userId });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Token generation error', { error: error.message });
    throw error;
  }
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    logger.error('Token verification error', { error: error.message });
    throw error;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification error', { error: error.message });
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        type: 'access',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY || '15m' }
    );

    logger.info('Access token refreshed successfully', { userId: decoded.userId });

    return { accessToken };
  } catch (error) {
    logger.error('Access token refresh error', { error: error.message });
    throw error;
  }
};

/**
 * Decode token without verification (use cautiously)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode error', { error: error.message });
    throw error;
  }
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  decodeToken,
};
