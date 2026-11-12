const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

describe('API Tests: Role-Based Access Control (RBAC) & Data Isolation', () => {
  let seededData;
  let patientToken;
  let doctor1Token;
  let doctor2Token;
  let adminToken;

  beforeAll(async () => {
    seededData = await resetTestDb();

    patientToken = jwt.sign(
      { userId: seededData.users.patient1.id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

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

    adminToken = jwt.sign(
      { userId: seededData.users.admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Patient Endpoint Protection', () => {
    it('must forbid a patient from accessing doctor appointments (expect 403)', async () => {
      const res = await request(app)
        .get('/api/doctor/appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a patient from accessing doctor analytics (expect 403)', async () => {
      const res = await request(app)
        .get('/api/doctor/analytics')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a patient from accessing doctor patient roster (expect 403)', async () => {
      const res = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a patient from accessing admin dashboard (expect 403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a patient from accessing admin user list (expect 403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });
  });

  describe('Doctor Endpoint Protection', () => {
    it('must forbid a doctor from accessing admin dashboard (expect 403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a doctor from approving another doctor (expect 403)', async () => {
      const res = await request(app)
        .post(`/api/admin/approve-doctor/${seededData.doctors.pendingDoctor.id}`)
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });

    it('must forbid a doctor from accessing patient symptoms portal (expect 403)', async () => {
      const res = await request(app)
        .get('/api/patient/symptoms')
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|insufficient permissions/i);
    });
  });

  describe('Doctor-to-Doctor Privacy & Data Isolation', () => {
    it('must not allow Doctor 1 to see Doctor 2 patients or revenue', async () => {
      const res = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Patient 2 has only seen Doctor 2 in seededData, so Doctor 1 must NOT see Patient 2
      const patientIds = res.body.map((p) => p.id);
      expect(patientIds).not.toContain(seededData.patients.patient2.id);
    });

    it('must not allow Doctor 1 to fetch Doctor 2 appointment details (expect 403)', async () => {
      // apptBooked2 belongs to Doctor 2 and Patient 2
      const res = await request(app)
        .get(`/api/appointment/${seededData.appointments.apptBooked2.id}`)
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Cannot access another doctor's appointment/i);
    });

    it('must allow Doctor 1 to fetch own appointment details (expect 200)', async () => {
      const res = await request(app)
        .get(`/api/appointment/${seededData.appointments.apptBooked1.id}`)
        .set('Authorization', `Bearer ${doctor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(seededData.appointments.apptBooked1.id);
    });

    it('must not allow Patient 1 to fetch Patient 2 appointment details (expect 403)', async () => {
      const res = await request(app)
        .get(`/api/appointment/${seededData.appointments.apptBooked2.id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden|Cannot access another patient's appointment/i);
    });
  });

  describe('Unauthenticated Rejection', () => {
    it('must return 401 when accessing protected doctor routes with no token', async () => {
      const res = await request(app).get('/api/doctor/analytics');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/No token provided/i);
    });

    it('must return 401 when accessing protected admin routes with no token', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/No token provided/i);
    });
  });
});

