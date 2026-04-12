const symptomAnalyzer = require('../services/ai/symptomAnalyzer.service');
const logger = require('../utils/logger');

module.exports = {
  analyzeSymptom: async (req, res) => {
    try {
      if (!req.body.text) return res.status(400).json({ error: 'Text required' });
      const analysis = await symptomAnalyzer.analyzeSymptom(req.body.text);
      res.json(analysis);
    } catch (error) {
      logger.error('Error analyzing symptom', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
};
