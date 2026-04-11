// Admin Controller
const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  getDashboard: async (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  },
  getPendingDoctors: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT d.*, u.email, u.phone 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.status = 'pending'
      `);
      res.json(result.rows);
    } catch (error) {
       logger.error('Error fetching pending doctors', { error: error.message });
       res.status(500).json({ error: error.message });
    }
  },
  approveDoctor: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [doctorId]);
      if (docRes.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
      
      await db.query(`UPDATE users SET status = 'active' WHERE id = $1`, [docRes.rows[0].user_id]);
      
      // Audit log
      await db.query(`INSERT INTO dpdp_audit_logs (user_id, action, resource_accessed) VALUES ($1, 'APPROVED_DOCTOR', 'doctors/' || $2)`, [req.user.userId, doctorId]);

      res.json({ message: 'Doctor approved successfully' });
    } catch (error) {
      logger.error('Error approving doctor', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  rejectDoctor: async (req, res) => {
     res.status(501).json({ error: 'Not implemented' });
  },
  getUsers: async (req, res) => {
     res.status(501).json({ error: 'Not implemented' });
  },
  getAnalytics: async (req, res) => {
    try {
      const patients = await db.query('SELECT COUNT(*) FROM patients');
      const doctors = await db.query('SELECT COUNT(*) FROM doctors');
      const appointments = await db.query('SELECT COUNT(*) FROM appointments');
      
      res.json({
        totalPatients: parseInt(patients.rows[0].count),
        totalDoctors: parseInt(doctors.rows[0].count),
        totalAppointments: parseInt(appointments.rows[0].count)
      });
    } catch (error) {
      logger.error('Error getting exact analytics', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  getAuditLogs: async (req, res) => {
     res.status(501).json({ error: 'Not implemented' });
  },
};
