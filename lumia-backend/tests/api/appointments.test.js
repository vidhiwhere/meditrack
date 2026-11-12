const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

describe('API Tests: Appointments Workflow (/api/appointment)', () => {
  let seededData;
  let patient1Token;
  let patient2Token;
  let doctor1Token;

  beforeEach(async () => {
    seededData = await resetTestDb();

    patient1Token = jwt.sign(
      { userId: seededData.users.patient1.id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    patient2Token = jwt.sign(
      { userId: seededData.users.patient2.id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    doctor1Token = jwt.sign(
      { userId: seededData.users.doctor1.id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/appointment/book - Booking & Negative Scenarios', () => {
    it('should successfully book a valid future appointment with an approved doctor', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/appointment/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: seededData.doctors.doctor1.id,
          date: futureDate,
          time: '10:00:00',
          reason: 'General wellness check',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Appointment booked successfully');
      expect(res.body).toHaveProperty('appointment');
      expect(res.body.appointment.status).toBe('BOOKED');
      expect(res.body.appointment.doctor_id).toBe(seededData.doctors.doctor1.id);
    });

    it('should reject booking an appointment in the past (negative case)', async () => {
      const pastDate = '2020-01-15';
      const res = await request(app)
        .post('/api/appointment/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: seededData.doctors.doctor1.id,
          date: pastDate,
          time: '09:00:00',
          reason: 'Time machine visit',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Cannot book an appointment in the past/i);
    });

    it('should reject booking with a non-existent doctor ID (negative case)', async () => {
      const nonExistentDocId = crypto.randomUUID();
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/appointment/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: nonExistentDocId,
          date: futureDate,
          time: '11:00:00',
          reason: 'Checkup',
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Doctor not found/i);
    });

    it('should reject double booking of the exact same slot for the same doctor (negative case)', async () => {
      const slotDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const slotTime = '14:00:00';

      // First booking succeeds
      const firstRes = await request(app)
        .post('/api/appointment/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: seededData.doctors.doctor1.id,
          date: slotDate,
          time: slotTime,
          reason: 'First booking',
        });
      expect(firstRes.status).toBe(201);

      // Second booking by Patient 2 for same doctor and same slot must fail with 409
      const secondRes = await request(app)
        .post('/api/appointment/book')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({
          doctorId: seededData.doctors.doctor1.id,
          date: slotDate,
          time: slotTime,
          reason: 'Conflicting booking attempt',
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body).toHaveProperty('error');
      expect(secondRes.body.error).toMatch(/Time slot is already booked/i);
    });
  });

  describe('GET /api/appointment - Fetching Appointments', () => {
    it('should fetch the list of appointments for the authenticated patient', async () => {
      const res = await request(app)
        .get('/api/appointment/list')
        .set('Authorization', `Bearer ${patient1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('scheduled_at');
      expect(res.body[0]).toHaveProperty('status');
    });

    it('should fetch the list of appointments for the authenticated doctor', async () => {
      const res = await request(app)
        .get('/api/appointment/list')
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should fetch single appointment by ID for the owning patient', async () => {
      const apptId = seededData.appointments.apptBooked1.id;
      const res = await request(app)
        .get(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(apptId);
    });
  });

  describe('PUT /api/appointment/:id - Rescheduling Scenarios', () => {
    it('should successfully reschedule an appointment to a valid future time slot', async () => {
      const apptId = seededData.appointments.apptBooked1.id;
      const newFutureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await request(app)
        .put(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          date: newFutureDate,
          time: '16:00:00',
          reason: 'Rescheduled reason',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Appointment rescheduled successfully');
      expect(res.body.appointment.pre_visit_notes).toBe('Rescheduled reason');
    });

    it('should reject rescheduling to a past date (negative case)', async () => {
      const apptId = seededData.appointments.apptBooked1.id;
      const pastDate = '2021-05-10';

      const res = await request(app)
        .put(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          date: pastDate,
          time: '10:00:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot reschedule to a past date/i);
    });

    it('should reject rescheduling someone else appointment (negative case)', async () => {
      // apptBooked2 belongs to Patient 2, Patient 1 tries to reschedule it
      const apptId = seededData.appointments.apptBooked2.id;
      const futureDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await request(app)
        .put(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          date: futureDate,
          time: '11:00:00',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Cannot reschedule another patient/i);
    });
  });

  describe('DELETE /api/appointment/:id - Cancellation Scenarios', () => {
    it('should reject cancelling someone else appointment (negative case)', async () => {
      // apptBooked2 belongs to Patient 2; Patient 1 tries to cancel
      const apptId = seededData.appointments.apptBooked2.id;

      const res = await request(app)
        .delete(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Cannot cancel another patient/i);
    });

    it('should successfully cancel own appointment', async () => {
      const apptId = seededData.appointments.apptBooked1.id;

      const res = await request(app)
        .delete(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Appointment cancelled');
      expect(res.body.appointment.status).toBe('CANCELLED');

      // Verify status in DB
      const checkRes = await request(app)
        .get(`/api/appointment/${apptId}`)
        .set('Authorization', `Bearer ${patient1Token}`);
      expect(checkRes.body.status).toBe('CANCELLED');
    });
  });
});

