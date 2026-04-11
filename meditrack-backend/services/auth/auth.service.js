const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const tokenService = require('./tokenService');
const logger = require('../../utils/logger');

/**
 * Register a new user
 */
const registerUser = async (email, phone, password, role, firstName, lastName) => {
  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or phone already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, phone, role, status, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, phone, role, status`,
      [email, passwordHash, phone, role, 'active', 'en']
    );

    const user = userResult.rows[0];

    // Always create a patient profile (for symptom tracking)
    await db.query(
      `INSERT INTO patients (user_id, first_name, last_name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [user.id, firstName || '', lastName || '']
    );

    // Create role-specific profile
    if (role === 'doctor') {
      // Doctor also gets a doctor profile
      await db.query(
        `INSERT INTO doctors (user_id, first_name, last_name, mci_registration_number, mci_verification_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [user.id, firstName || '', lastName || '', 'temp_' + user.id, 'pending']
      );
    }

    logger.info('User registered successfully', { userId: user.id, email, role });
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    throw error;
  }
};

/**
 * Login user
 */
const loginUser = async (email, password) => {
  try {
    // Find user by email
    const userResult = await db.query(
      'SELECT id, email, password_hash, phone, role, status FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('User account is inactive or pending approval');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await tokenService.generateTokens(user.id, user.role);

    logger.info('User logged in successfully', { userId: user.id, email });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Login error', { error: error.message });
    throw error;
  }
};

/**
 * Verify password
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Password verification error', { error: error.message });
    throw error;
  }
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Password hashing error', { error: error.message });
    throw error;
  }
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  try {
    const result = await db.query(
      'SELECT id, email, phone, role, status, language FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    throw error;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    const allowedFields = ['language', 'status'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return await getUserById(userId);
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, phone, role, status, language`;

    const result = await db.query(query, values);
    logger.info('User profile updated', { userId });
    return result.rows[0];
  } catch (error) {
    logger.error('Update user profile error', { error: error.message });
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyPassword,
  hashPassword,
  getUserById,
  updateUserProfile,
};
