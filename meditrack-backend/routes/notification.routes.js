const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(verifyToken);
router.post('/send', authorize('admin'), notificationController.sendDirectMessage);

module.exports = router;
