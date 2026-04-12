// Prescription Controller
const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  createPrescription: async (req, res) => {
     res.status(501).json({ error: 'Use doctor/prescriptions endpoint to create' });
  },
  getPrescription: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`SELECT * FROM prescriptions WHERE id = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get prescription error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  listPrescriptions: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Determine if patient or doctor based on role
      if (req.user.role === 'patient') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
        if (pRes.rows.length > 0) {
           const result = await db.query(`SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`, [pRes.rows[0].id]);
           return res.json(result.rows);
        }
      } else if (req.user.role === 'doctor') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
        if (dRes.rows.length > 0) {
           const result = await db.query(`SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY created_at DESC`, [dRes.rows[0].id]);
           return res.json(result.rows);
        }
      }
      res.status(404).json({ error: 'Profile not found' });
    } catch (error) {
      logger.error('List prescriptions error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  updatePrescription: async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  },
  verifyPrescription: async (req, res) => {
    try {
      const { hash } = req.params;
      const result = await db.query(`SELECT * FROM prescriptions WHERE qr_verification_hash = $1`, [hash]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Invalid or expired prescription hash' });
      
      // Audit log the verification attempt
      await db.query(`INSERT INTO dpdp_audit_logs (user_id, action, resource_accessed) VALUES ($1, 'VERIFIED_PRESCRIPTION', $2)`, [req.user?.userId || null, result.rows[0].id]);

      res.json({ verified: true, prescription: result.rows[0] });
    } catch (error) {
      logger.error('Verify prescription error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
};
