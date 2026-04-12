const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  createClinic: async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  },
  getClinic: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM clinics WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching clinic', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  listClinics: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM clinics');
      res.json(result.rows);
    } catch (error) {
      logger.error('Error fetching clinics', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  updateClinic: async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  },
};
