const jwt = require('jsonwebtoken');
const env = require('../config/env');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', message: error.message });
  }
};

const refreshToken = (req, res, next) => {
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const newToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );

    res.json({ accessToken: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token', message: error.message });
  }
};

module.exports = {
  verifyToken,
  refreshToken,
};
