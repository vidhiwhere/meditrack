const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

describe('API Tests: Authentication (/api/auth)', () => {
  let seededData;

  beforeAll(async () => {
    seededData = await resetTestDb();
  });

  describe('POST /api/auth/login - Role-Based Valid Logins', () => {
    it('should successfully log in as a doctor with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor1@lumia.com',
          password: 'doc123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.role).toBe('doctor');
      expect(res.body.user.email).toBe('doctor1@lumia.com');
    });

    it('should successfully log in as a patient with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient1@lumia.com',
          password: 'pat123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.role).toBe('patient');
      expect(res.body.user.email).toBe('patient1@lumia.com');
    });

    it('should successfully log in as an admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@lumia.com',
          password: 'admin123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.email).toBe('admin@lumia.com');
    });
  });

  describe('POST /api/auth/login - Negative Cases', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doctor1@lumia.com',
          password: 'incorrectPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Invalid credentials/i);
    });

    it('should reject login with unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown_user_404@lumia.com',
          password: 'somepassword',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Invalid credentials/i);
    });

    it('should reject login when email field is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'pat123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject login when password field is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient1@lumia.com',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject inactive/pending doctor login until approved', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'pendingdoc@lumia.com',
          password: 'doc123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/inactive or pending approval/i);
    });
  });

  describe('Token Security: Expired, Tampered & Missing Tokens', () => {
    it('should reject request when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/No token provided/i);
    });

    it('should reject request when token is tampered/invalid signature', async () => {
      const validPayload = { userId: seededData.users.patient1.id, role: 'patient' };
      const forgedToken = jwt.sign(validPayload, 'wrong_tampered_secret_key_123');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Invalid token/i);
    });

    it('should reject request when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: seededData.users.patient1.id, role: 'patient' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Invalid token/i);
    });

    it('should accept valid signed token for /api/auth/me', async () => {
      const validToken = jwt.sign(
        { userId: seededData.users.patient1.id, role: 'patient' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('patient1@lumia.com');
    });
  });
});

