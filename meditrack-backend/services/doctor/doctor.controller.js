const doctorService = require('./doctor.service');

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await doctorService.getAppointments(req.user.id);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error fetching appointments' });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { appointment_id, patient_id, medications } = req.body;
    const prescription = await doctorService.createPrescription(req.user.id, appointment_id, patient_id, medications);
    res.status(201).json({ message: 'Digital Prescription created successfully.', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error creating prescription' });
  }
};
