# [BUG-002] Broken Object Level Authorization (BOLA) in Appointment Cancellation & Reschedule

**Issue Title:** Patients can cancel or reschedule appointments belonging to other patients  
**Severity:** Critical (Security / BOLA - OWASP API Top 10 API1:2023)  
**Component:** Backend API (`DELETE /api/appointment/:id`, `PUT /api/appointment/:id`)  
**Found By:** Automated RBAC & Appointment Negative Suite (`tests/api/appointments.test.js`)  
**Status:** Resolved  

---

## 1. Description
The appointment cancellation endpoint (`DELETE /api/appointment/:id`) and reschedule endpoint executed database queries using only the appointment's primary key (`id`), without verifying that the authenticated user (`req.user.userId`) was the patient or doctor associated with that appointment. Any authenticated user with a valid JWT could cancel or alter any patient's appointments across the entire platform simply by supplying the appointment's UUID.

## 2. Environment
- **OS:** Windows / Linux (Ubuntu runner)
- **Node.js:** Express API
- **Affected Routes:** `DELETE /api/appointment/:id`, `PUT /api/appointment/:id`

## 3. Steps to Reproduce
1. Log in as Patient A (`patient1@lumia.com`) and obtain JWT Token A.
2. Log in as Patient B (`patient2@lumia.com`) and book an appointment (ID: `appt-uuid-B`).
3. Send an HTTP DELETE request using Patient A's token:
   ```bash
   curl -X DELETE http://localhost:3000/api/appointment/appt-uuid-B \
     -H "Authorization: Bearer <Token_A>"
   ```
4. Check response status code and database state.

## 4. Expected Behavior
The API must return `403 Forbidden` (`{ "error": "Forbidden: Cannot cancel another patient's appointment" }`). The appointment must remain unchanged.

## 5. Actual Behavior (Pre-Fix)
The API responded with `200 OK` (`{ "message": "Appointment cancelled" }`), modifying Patient B's appointment without authorization.

## 6. Root Cause Analysis
In `lumia-backend/controllers/appointment.controller.js`:
```javascript
// appointment.controller.js (Buggy implementation)
cancelAppointment: async (req, res) => {
  const { id } = req.params;
  // Directly updates without checking patient_id or doctor_id ownership!
  const result = await db.query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [id]);
  ...
}
```

## 7. Fix Applied
Added strict ownership validation in `appointment.controller.js`:
```javascript
// Fetch appointment first and compare against the authenticated patient/doctor profile
const apptRes = await db.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
if (apptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
const appt = apptRes.rows[0];

if (role === 'patient') {
  const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  if (pRes.rows.length === 0 || pRes.rows[0].id !== appt.patient_id) {
    return res.status(403).json({ error: 'Forbidden: Cannot cancel another patient\'s appointment' });
  }
}
```

## 8. Verification & Test Evidence
- Covered by test: `tests/api/appointments.test.js` (`should reject cancelling someone else appointment (negative case)`).
- Result: **Passed** with HTTP 403.

