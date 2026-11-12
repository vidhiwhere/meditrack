const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

describe('API Tests: Consultation Completion & Fee Boundary Cases (/api/doctor/appointments/status)', () => {
  let seededData;
  let doctor1Token;
  let doctor2Token;

  beforeEach(async () => {
    seededData = await resetTestDb();

    doctor1Token = jwt.sign(
      { userId: seededData.users.doctor1.id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    doctor2Token = jwt.sign(
      { userId: seededData.users.doctor2.id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Consultation Completion & Analytics Update', () => {
    it('should complete consultation, save the fee, and update doctor analytics', async () => {
      // 1. Initial analytics check
      const initialAnalytics = await request(app)
        .get('/api/doctor/analytics')
        .set('Authorization', `Bearer ${doctor1Token}`);
      expect(initialAnalytics.status).toBe(200);

      const initialCompleted = initialAnalytics.body.completedAppointments;
      const initialRevenue = parseFloat(initialAnalytics.body.totalRevenue);

      // 2. Complete appointment apptBooked1 with a fee of 750
      const apptId = seededData.appointments.apptBooked1.id;
      const consultationFee = 750;

      const completeRes = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: consultationFee,
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body).toHaveProperty('message', 'Appointment status updated');
      expect(completeRes.body.appointment.status).toBe('COMPLETED');
      expect(parseFloat(completeRes.body.appointment.fee)).toBe(consultationFee);

      // 3. Verify analytics update
      const updatedAnalytics = await request(app)
        .get('/api/doctor/analytics')
        .set('Authorization', `Bearer ${doctor1Token}`);
      expect(updatedAnalytics.status).toBe(200);

      expect(updatedAnalytics.body.completedAppointments).toBe(initialCompleted + 1);
      expect(parseFloat(updatedAnalytics.body.totalRevenue)).toBe(initialRevenue + consultationFee);
    });
  });

  describe('Fee Boundary Cases', () => {
    it('boundary case: fee of 0 should be saved successfully (free follow-up)', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 0,
        });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.appointment.fee)).toBe(0);
      expect(res.body.appointment.status).toBe('COMPLETED');
    });

    it('boundary case: negative fee should be rejected with 400', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: -500,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/cannot be negative/i);
    });

    it('boundary case: non-numeric fee should be rejected with 400', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 'five_hundred_dollars',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/must be a valid number/i);
    });

    it('boundary case: huge fee exceeding reasonable limit should be rejected with 400', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 50000000, // 50 million
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/exceeds allowable limit/i);
    });

    it('boundary case: completing the same appointment twice should be rejected with 400', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      // Complete once
      const firstRes = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 500,
        });
      expect(firstRes.status).toBe(200);

      // Attempt to complete a second time
      const secondRes = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor1Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 500,
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body).toHaveProperty('error');
      expect(secondRes.body.error).toMatch(/already been completed/i);
    });

    it('negative case: Doctor B must not complete Doctor A appointment (expect 403)', async () => {
      // apptBooked1 belongs to Doctor 1; Doctor 2 attempts completion
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .put('/api/doctor/appointments/status')
        .set('Authorization', `Bearer ${doctor2Token}`)
        .send({
          appointmentId: apptId,
          status: 'COMPLETED',
          fee: 800,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Cannot update another doctor's appointment/i);
    });
  });
});

