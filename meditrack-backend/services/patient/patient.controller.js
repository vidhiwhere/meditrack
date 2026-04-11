const patientService = require('./patient.service');

exports.evaluateSymptoms = async (req, res) => {
  try {
    const { raw_text, patient_id } = req.body;
    const analysis = await patientService.evaluateSymptoms(patient_id, raw_text);
    res.json({ message: 'Symptoms analyzed', analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const timeline = await patientService.getTimeline(patient_id);
    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

exports.getFamilyProfiles = async (req, res) => {
  try {
    const profiles = await patientService.getFamilyProfiles(req.user.id);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch family profiles' });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, clinic_id, scheduled_at, pre_visit_notes } = req.body;
    const appt = await patientService.bookAppointment(patient_id, doctor_id, clinic_id, scheduled_at, pre_visit_notes);
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};
