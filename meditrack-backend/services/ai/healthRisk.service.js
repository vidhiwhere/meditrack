// Health Risk Service - Predictive health risk scoring
const { OpenAI } = require('openai');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let openai;
if (env.AI_SERVICE_KEY) {
  openai = new OpenAI({ apiKey: env.AI_SERVICE_KEY });
}

module.exports = {
  calculateHealthRiskScore: async (patientId, symptoms) => {
    try {
      if (!openai || !symptoms || symptoms.length === 0) {
        return fallbackRiskScore(symptoms);
      }

      const prompt = `
        Analyze the following symptom history for a patient:
        ${JSON.stringify(symptoms)}
        
        Provide a JSON response with:
        - score: A number from 0-100 indicating health risk (100 = excellent health, 0 = critical risk).
        - status: 'Excellent', 'Good', 'Fair', or 'Poor'.
        - message: A brief overall message.
        - riskFactors: Array of strings detailing identified risks.
        - recommendations: Array of strings detailing recommendations.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are a predictive health risk model analyzer. Output only valid JSON.' }, { role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('OpenAI health risk error', { error: error.message });
      return fallbackRiskScore(symptoms);
    }
  },
  identifyRiskFactors: async (patientId) => {
    return [];
  },
  generateRecommendations: async (patientId) => {
    return [];
  },
};

function fallbackRiskScore(symptoms) {
  if (!symptoms || symptoms.length === 0) return { score: 100, status: 'Excellent', message: 'No issues', riskFactors: [], recommendations: [] };
  const avgRisk = symptoms.reduce((sum, s) => sum + (s.risk_score || 0), 0) / symptoms.length;
  let score = Math.max(0, 100 - avgRisk);
  score = Math.round(score);
  return {
    score,
    status: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Poor',
    message: 'Calculated using fallback approach',
    riskFactors: [],
    recommendations: ['Consult a doctor']
  };
}
