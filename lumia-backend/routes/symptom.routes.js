const express = require('express');
const router = express.Router();
const symptomController = require('../controllers/symptom.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);
router.post('/analyze', symptomController.analyzeSymptom);

module.exports = router;
