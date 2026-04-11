const authService = require('./auth.service');

exports.register = async (req, res) => {
  try {
    const { phone, password, role, name } = req.body;
    const user = await authService.registerUser(phone, password, role, name);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const { token, role } = await authService.loginUser(phone, password);
    res.json({ token, role });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Server error during login.' });
  }
};
