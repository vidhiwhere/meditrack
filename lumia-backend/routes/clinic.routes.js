const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinic.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(verifyToken);

router.post('/create', authorize('admin'), clinicController.createClinic);
router.get('/list', authorize('admin', 'doctor'), clinicController.listClinics);
router.get('/:id', authorize('admin', 'doctor'), clinicController.getClinic);
router.put('/:id', authorize('admin', 'doctor'), clinicController.updateClinic);

module.exports = router;
