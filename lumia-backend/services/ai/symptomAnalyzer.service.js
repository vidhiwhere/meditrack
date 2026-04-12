// Symptom Analyzer Service - AI-powered symptom analysis
const { OpenAI } = require('openai');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let openai;
if (env.AI_SERVICE_KEY) {
  openai = new OpenAI({ apiKey: env.AI_SERVICE_KEY });
}

module.exports = {
  analyzeSymptom: async (symptomDescription) => {
    try {
      if (!openai) {
        logger.warn('OpenAI not configured, falling back to basic analysis.');
        return fallbackAnalysis(symptomDescription);
      }

      const prompt = `
        Analyze the following patient symptom description:
        "${symptomDescription}"
        
        Provide a JSON response with:
        - conditions: Array of probable root conditions or keywords.
        - urgency: 'LOW', 'MEDIUM', 'HIGH', or 'EMERGENCY'.
        - recommendedDoctorType: The most appropriate specialist (e.g. 'General Physician', 'Cardiologist').
        - risk_score: A number from 0-100 indicating severity.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are a medical triage assistant. Output only valid JSON.' }, { role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('OpenAI symptom analysis error', { error: error.message });
      return fallbackAnalysis(symptomDescription);
    }
  },
  
  generateQuestionnaire: async (symptomAnalysis) => {
    // Generate smart questions based on symptom
    return [];
  },
};

function fallbackAnalysis(text) {
  const emergencyKeywords = ['emergency', 'chest pain', 'breathing', 'unconscious'];
  const lowerText = text.toLowerCase();
  
  let urgency = 'LOW';
  let score = 10;
  if (emergencyKeywords.some(k => lowerText.includes(k))) {
    urgency = 'EMERGENCY';
    score = 90;
  }
  return {
    conditions: ['Unknown'],
    urgency,
    recommendedDoctorType: 'General Physician',
    risk_score: score
  };
}
