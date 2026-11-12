const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('API Tests: Contract & Schema Validation Across All Responses', () => {
  let seededData;
  let patientToken;
  let doctorToken;
  let adminToken;

  beforeAll(async () => {
    seededData = await resetTestDb();

    patientToken = jwt.sign(
      { userId: seededData.users.patient1.id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    doctorToken = jwt.sign(
      { userId: seededData.users.doctor1.id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: seededData.users.admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Health Check Schema (/health)', () => {
    it('should conform to { status: string, timestamp: string } schema', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(typeof res.body.status).toBe('string');
      expect(res.body.status).toBe('Server is running');
      expect(typeof res.body.timestamp).toBe('string');
      expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Authentication Response Schema (/api/auth/login)', () => {
    it('should return correct types and non-null required fields on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor1@lumia.com',
          password: 'doc123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: expect.any(String),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.stringMatching(UUID_REGEX),
          email: expect.any(String),
          phone: expect.any(String),
          role: expect.stringMatching(/^(doctor|patient|admin)$/),
        },
      });

      // Verify JWT structure (3 parts separated by dots)
      expect(res.body.accessToken.split('.').length).toBe(3);
    });
  });

  describe('Uniform Error Message Format on 400, 401, 403, 404', () => {
    it('400 bad request returns { error: string }', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({}); // missing credentials

      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('401 unauthorized returns { error: string }', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('403 forbidden returns { error: string }', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('404 not found returns { error: string }', async () => {
      const res = await request(app).get('/api/non-existent-route-endpoint');
      expect(res.status).toBe(404);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });
  });

  describe('Appointment Schema (/api/appointment/:id & /list)', () => {
    it('appointment objects must adhere to typed contract', async () => {
      const res = await request(app)
        .get('/api/appointment/list')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      for (const appt of res.body) {
        expect(appt).toMatchObject({
          id: expect.stringMatching(UUID_REGEX),
          patient_id: expect.stringMatching(UUID_REGEX),
          doctor_id: expect.stringMatching(UUID_REGEX),
          scheduled_at: expect.any(String),
          status: expect.stringMatching(/^(BOOKED|COMPLETED|CANCELLED)$/),
        });
        expect(new Date(appt.scheduled_at).getTime()).not.toBeNaN();
      }
    });
  });

  describe('Doctor Analytics Response Schema (/api/doctor/analytics)', () => {
    it('analytics response must contain strictly typed numerical counters', async () => {
      const res = await request(app)
        .get('/api/doctor/analytics')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalAppointments: expect.any(Number),
        completedAppointments: expect.any(Number),
        prescriptionsIssued: expect.any(Number),
        patientsSeen: expect.any(Number),
        avgRating: expect.any(Number),
        totalRevenue: expect.any(Number),
        completionRate: expect.any(Number),
      });

      expect(res.body.completionRate).toBeGreaterThanOrEqual(0);
      expect(res.body.completionRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Public Verified Doctors List Schema (/api/appointment/doctors)', () => {
    it('doctor directory objects must include required fields and specialization string', async () => {
      const res = await request(app)
        .get('/api/appointment/doctors')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      for (const doctor of res.body) {
        expect(doctor).toMatchObject({
          id: expect.stringMatching(UUID_REGEX),
          first_name: expect.any(String),
          last_name: expect.any(String),
          specialization: expect.any(String),
          verification_status: 'APPROVED',
        });
      }
    });
  });
});

