// Appointment Controller
const db = require('../config/db');
const logger = require('../utils/logger');
const notificationService = require('../services/notification/notification.service');

module.exports = {
  bookAppointment: async (req, res) => {
    try {
      const { doctorId, date, time, reason } = req.body;
      const userId = req.user.userId;

      // Get patient id from user id
      const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1 LIMIT 1', [userId]);
      if (pRes.rows.length === 0) return res.status(404).json({ error: 'Patient profile not found' });
      const pId = pRes.rows[0].id;

      let appointmentTime = time;
      if (date && time) {
          appointmentTime = `${date} ${time}`;
      } else if (!time) {
          appointmentTime = date; // fallback if date includes time
      }

      const result = await db.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, pre_visit_notes)
         VALUES ($1, $2, $3, 'SCHEDULED', $4) RETURNING *`,
        [pId, doctorId, appointmentTime, reason]
      );

      await notificationService.sendAppointmentReminder(result.rows[0].id, pId, doctorId, appointmentTime);

      res.status(201).json({ message: 'Appointment booked successfully', appointment: result.rows[0] });
    } catch (error) {
      logger.error('Book appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  getAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  listAppointments: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Determine if patient or doctor based on role
      if (req.user.role === 'patient') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
        if (pRes.rows.length > 0) {
           const result = await db.query(`SELECT * FROM appointments WHERE patient_id = $1 ORDER BY scheduled_at DESC`, [pRes.rows[0].id]);
           return res.json(result.rows);
        }
      } else if (req.user.role === 'doctor') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
        if (dRes.rows.length > 0) {
           const result = await db.query(`SELECT * FROM appointments WHERE doctor_id = $1 ORDER BY scheduled_at DESC`, [dRes.rows[0].id]);
           return res.json(result.rows);
        }
      }
      res.status(404).json({ error: 'Profile not found' });
    } catch (error) {
      logger.error('List appointments error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  updateAppointment: async (req, res) => {
     res.status(501).json({ error: 'Not implemented' });
  },
  cancelAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      res.json({ message: 'Appointment cancelled', appointment: result.rows[0] });
    } catch (error) {
      logger.error('Cancel appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
  getDoctors: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT d.id, d.specialization, d.years_experience as experience_years, u.first_name, u.last_name 
        FROM doctors d
        JOIN users u ON d.user_id = u.id
      `);
      res.json(result.rows);
    } catch (error) {
      logger.error('Get doctors error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
};
