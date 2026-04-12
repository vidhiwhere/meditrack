const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(verifyToken);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/doctors-pending', adminController.getPendingDoctors);
router.get('/doctors', adminController.getPendingDoctors); // alias for frontend nav
router.post('/approve-doctor/:doctorId', adminController.approveDoctor);
router.post('/reject-doctor/:doctorId', adminController.rejectDoctor);
router.get('/users', adminController.getUsers);
router.get('/analytics', adminController.getAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
