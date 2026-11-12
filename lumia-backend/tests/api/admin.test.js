const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { resetTestDb } = require('../setup/testDb');

describe('API Tests: Admin Doctor Verification & Platform Oversight (/api/admin)', () => {
  let seededData;
  let adminToken;
  let patientToken;

  beforeEach(async () => {
    seededData = await resetTestDb();

    adminToken = jwt.sign(
      { userId: seededData.users.admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    patientToken = jwt.sign(
      { userId: seededData.users.patient1.id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Unverified Doctor Behavior in Patient Booking List', () => {
    it('unverified/pending doctor must NOT appear in the patient booking list', async () => {
      const res = await request(app)
        .get('/api/appointment/doctors')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const availableDocIds = res.body.map((d) => d.id);
      // Approved doctors must appear
      expect(availableDocIds).toContain(seededData.doctors.doctor1.id);
      expect(availableDocIds).toContain(seededData.doctors.doctor2.id);

      // Pending/unverified doctor must NOT appear
      expect(availableDocIds).not.toContain(seededData.doctors.pendingDoctor.id);
    });

    it('admin can list pending doctors needing verification', async () => {
      const res = await request(app)
        .get('/api/admin/doctors-pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const pendingIds = res.body.map((d) => d.id);
      expect(pendingIds).toContain(seededData.doctors.pendingDoctor.id);
    });
  });

  describe('Admin Approves Doctor & Verifies Updated Behavior', () => {
    it('admin approves pending doctor: verification status updates and doctor appears in booking list', async () => {
      const pendingDocId = seededData.doctors.pendingDoctor.id;

      // 1. Admin approves doctor
      const approveRes = await request(app)
        .post(`/api/admin/approve-doctor/${pendingDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body).toHaveProperty('message', 'Doctor approved successfully');

      // 2. Doctor now appears in patient booking list
      const bookingListRes = await request(app)
        .get('/api/appointment/doctors')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(bookingListRes.status).toBe(200);
      const docIds = bookingListRes.body.map((d) => d.id);
      expect(docIds).toContain(pendingDocId);

      // 3. Approved doctor can now log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'pendingdoc@lumia.com',
          password: 'doc123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('accessToken');
      expect(loginRes.body.user.role).toBe('doctor');

      // 4. Verify audit log entry was created
      const auditRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      const approvedLog = auditRes.body.find((log) => log.action === 'APPROVED_DOCTOR');
      expect(approvedLog).toBeDefined();
    });

    it('admin rejects doctor: status updates and doctor is not listed', async () => {
      const pendingDocId = seededData.doctors.pendingDoctor.id;

      const rejectRes = await request(app)
        .post(`/api/admin/reject-doctor/${pendingDocId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body).toHaveProperty('message', 'Doctor rejected successfully');

      // Ensure rejected doctor does not appear in booking list
      const bookingListRes = await request(app)
        .get('/api/appointment/doctors')
        .set('Authorization', `Bearer ${patientToken}`);

      const docIds = bookingListRes.body.map((d) => d.id);
      expect(docIds).not.toContain(pendingDocId);
    });
  });

  describe('Admin Platform Overview & Analytics', () => {
    it('admin can fetch platform analytics summary', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPatients');
      expect(res.body).toHaveProperty('totalDoctors');
      expect(res.body).toHaveProperty('totalAppointments');
      expect(typeof res.body.totalPatients).toBe('number');
      expect(typeof res.body.totalDoctors).toBe('number');
      expect(typeof res.body.totalAppointments).toBe('number');
    });

    it('admin can fetch users list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
