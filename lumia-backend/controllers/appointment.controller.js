// Appointment Controller
const db = require('../config/db');
const logger = require('../utils/logger');
const notificationService = require('../services/notification/notification.service');

module.exports = {
  bookAppointment: async (req, res) => {
    try {
      const { doctorId, date, time, reason } = req.body;
      const userId = req.user.userId;

      if (!doctorId) {
        return res.status(400).json({ error: 'Doctor ID is required' });
      }

      if (!date && !time) {
        return res.status(400).json({ error: 'Appointment date and time are required' });
      }

      // Check if doctor exists and is approved
      const docCheck = await db.query(
        'SELECT id, verification_status FROM doctors WHERE id = $1',
        [doctorId]
      );
      if (docCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

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

      const scheduledDate = new Date(appointmentTime);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: 'Invalid appointment date format' });
      }

      // Negative check: past date
      if (scheduledDate < new Date()) {
        return res.status(400).json({ error: 'Cannot book an appointment in the past' });
      }

      // Negative check: double booking of same doctor & slot (excluding cancelled)
      const conflictCheck = await db.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = $1 AND scheduled_at = $2 AND status != 'CANCELLED'`,
        [doctorId, scheduledDate.toISOString()]
      );

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Time slot is already booked for this doctor' });
      }

      const result = await db.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, pre_visit_notes)
         VALUES ($1, $2, $3, 'BOOKED', $4) RETURNING *`,
        [pId, doctorId, scheduledDate.toISOString(), reason]
      );

      // Send notification (non-blocking — don't fail the booking if notification fails)
      try {
        await notificationService.sendAppointmentReminder(result.rows[0].id, pId, doctorId, appointmentTime);
      } catch (notifErr) {
        logger.warn('Appointment booked but notification failed', { error: notifErr.message });
      }

      res.status(201).json({ message: 'Appointment booked successfully', appointment: result.rows[0] });
    } catch (error) {
      logger.error('Book appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  getAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const role = req.user.role;

      const result = await db.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      const appt = result.rows[0];

      // Privacy checks: patient only sees their own; doctor only sees their own; admin sees all
      if (role === 'patient') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
        if (pRes.rows.length === 0 || pRes.rows[0].id !== appt.patient_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot access another patient\'s appointment' });
        }
      } else if (role === 'doctor') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
        if (dRes.rows.length === 0 || dRes.rows[0].id !== appt.doctor_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot access another doctor\'s appointment' });
        }
      }

      res.json(appt);
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
      } else if (req.user.role === 'admin') {
        const result = await db.query(`SELECT * FROM appointments ORDER BY scheduled_at DESC LIMIT 100`);
        return res.json(result.rows);
      }
      res.status(404).json({ error: 'Profile not found' });
    } catch (error) {
      logger.error('List appointments error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  updateAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const { date, time, scheduled_at, reason } = req.body;
      const userId = req.user.userId;
      const role = req.user.role;

      const apptRes = await db.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
      if (apptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      const appt = apptRes.rows[0];

      // Ownership authorization
      if (role === 'patient') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
        if (pRes.rows.length === 0 || pRes.rows[0].id !== appt.patient_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot reschedule another patient\'s appointment' });
        }
      } else if (role === 'doctor') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
        if (dRes.rows.length === 0 || dRes.rows[0].id !== appt.doctor_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot reschedule another doctor\'s appointment' });
        }
      }

      let newTimeString = scheduled_at;
      if (date && time) {
        newTimeString = `${date} ${time}`;
      } else if (date) {
        newTimeString = date;
      }

      let updatedTimeIso = appt.scheduled_at;
      if (newTimeString) {
        const parsedDate = new Date(newTimeString);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: 'Invalid appointment date format' });
        }
        if (parsedDate < new Date()) {
          return res.status(400).json({ error: 'Cannot reschedule to a past date' });
        }
        updatedTimeIso = parsedDate.toISOString();

        // Check conflicts
        const conflict = await db.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = $1 AND scheduled_at = $2 AND id != $3 AND status != 'CANCELLED'`,
          [appt.doctor_id, updatedTimeIso, id]
        );
        if (conflict.rows.length > 0) {
          return res.status(409).json({ error: 'Time slot already booked' });
        }
      }

      const updated = await db.query(
        `UPDATE appointments 
         SET scheduled_at = $1,
             pre_visit_notes = COALESCE($2, pre_visit_notes)
         WHERE id = $3 RETURNING *`,
        [updatedTimeIso, reason !== undefined ? reason : null, id]
      );

      res.json({ message: 'Appointment rescheduled successfully', appointment: updated.rows[0] });
    } catch (error) {
      logger.error('Update appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  cancelAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const role = req.user.role;

      const apptRes = await db.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
      if (apptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
      const appt = apptRes.rows[0];

      // Ownership authorization
      if (role === 'patient') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
        if (pRes.rows.length === 0 || pRes.rows[0].id !== appt.patient_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot cancel another patient\'s appointment' });
        }
      } else if (role === 'doctor') {
        const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
        if (dRes.rows.length === 0 || dRes.rows[0].id !== appt.doctor_id) {
          return res.status(403).json({ error: 'Forbidden: Cannot cancel another doctor\'s appointment' });
        }
      }

      const result = await db.query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [id]);
      res.json({ message: 'Appointment cancelled', appointment: result.rows[0] });
    } catch (error) {
      logger.error('Cancel appointment error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  getDoctors: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT d.id, d.specializations, d.first_name, d.last_name, d.verification_status, d.consultation_fee
        FROM doctors d
        WHERE d.verification_status = 'APPROVED'
      `);
      // Normalize: use first specialization from array for display
      const doctors = result.rows.map(d => ({
        ...d,
        specialization: d.specializations && d.specializations.length > 0 ? d.specializations[0] : 'General Physician'
      }));
      res.json(doctors);
    } catch (error) {
      logger.error('Get doctors error', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
};
