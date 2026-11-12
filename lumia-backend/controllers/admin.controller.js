// Admin Controller
const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = {
  getDashboard: async (req, res) => {
    try {
      // Just returning recent active users and recent appointments for a dashboard feed
      const recentUsers = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
      const recentAppointments = await db.query('SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5');
      res.json({
        recentUsers: recentUsers.rows,
        recentAppointments: recentAppointments.rows
      });
    } catch (error) {
      logger.error('Error fetching dashboard data', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  getPendingDoctors: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT d.*, u.email, u.phone 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.status = 'pending' OR d.verification_status = 'PENDING'
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
      await db.query(`UPDATE doctors SET verification_status = 'APPROVED' WHERE id = $1`, [doctorId]);
      
      // Audit log
      await db.query(`INSERT INTO dpdp_audit_logs (user_id, action, resource_accessed) VALUES ($1, 'APPROVED_DOCTOR', 'doctors/' || $2)`, [req.user.userId, doctorId]);

      res.json({ message: 'Doctor approved successfully' });
    } catch (error) {
      logger.error('Error approving doctor', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  rejectDoctor: async (req, res) => {
     try {
       const { doctorId } = req.params;
       const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [doctorId]);
       if (docRes.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
       
       await db.query(`UPDATE users SET status = 'rejected' WHERE id = $1`, [docRes.rows[0].user_id]);
       await db.query(`UPDATE doctors SET verification_status = 'REJECTED' WHERE id = $1`, [doctorId]);
       
       // Audit log
       await db.query(`INSERT INTO dpdp_audit_logs (user_id, action, resource_accessed) VALUES ($1, 'REJECTED_DOCTOR', 'doctors/' || $2)`, [req.user.userId, doctorId]);

       res.json({ message: 'Doctor rejected successfully' });
     } catch (error) {
       logger.error('Error rejecting doctor', { error: error.message });
       res.status(500).json({ error: error.message });
     }
  },
  getUsers: async (req, res) => {
     try {
       const result = await db.query(`
         SELECT u.id, u.email, u.phone, u.role, u.status, u.created_at,
                p.first_name as p_first, p.last_name as p_last,
                d.first_name as d_first, d.last_name as d_last
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         ORDER BY u.created_at DESC
       `);
       res.json(result.rows);
     } catch (error) {
       logger.error('Error fetching users', { error: error.message });
       res.status(500).json({ error: error.message });
     }
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
     try {
       const result = await db.query(`
         SELECT a.*, u.email as user_email 
         FROM dpdp_audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.timestamp DESC LIMIT 100
       `);
       res.json(result.rows);
     } catch (error) {
       logger.error('Error fetching audit logs', { error: error.message });
       res.status(500).json({ error: error.message });
     }
  },
};
