# [BUG-001] Admin Doctor Approval Does Not Update Verification Status in `doctors` Table

**Issue Title:** Newly approved doctor does not appear in patient booking directory after admin approval  
**Severity:** High (Functional Defect / Business Workflow Blocker)  
**Component:** Backend API (`/api/admin/approve-doctor/:doctorId`)  
**Found By:** Automated API Test Suite (`tests/api/admin.test.js`)  
**Status:** Resolved  

---

## 1. Description
When an administrator approves a pending doctor registration via `POST /api/admin/approve-doctor/:doctorId`, the backend only updates `users.status = 'active'`, leaving `doctors.verification_status` stuck in `'PENDING'`. Because the appointment booking endpoint (`GET /api/appointment/doctors`) filters doctors with `WHERE d.verification_status = 'APPROVED'`, the newly approved doctor never appears in the patient booking directory.

## 2. Environment
- **OS:** Windows / Linux (Docker)
- **Node.js:** v20+ / v24+
- **Database:** PostgreSQL (Neon.tech & Local Docker)
- **Endpoint:** `POST /api/admin/approve-doctor/:doctorId`

## 3. Steps to Reproduce
1. Register a new doctor account via `POST /api/auth/register` with role `doctor` (or seed a doctor with `verification_status = 'PENDING'`).
2. Log in as an administrator (`admin@lumia.com`).
3. Call `POST /api/admin/approve-doctor/{doctorId}` with the doctor's UUID.
4. Response returns `200 OK` with `{ message: "Doctor approved successfully" }`.
5. Log in as a patient and fetch the list of available specialists via `GET /api/appointment/doctors`.
6. Inspect the returned list.

## 4. Expected Behavior
The newly approved doctor should have `verification_status = 'APPROVED'` and immediately appear in the `GET /api/appointment/doctors` booking list so patients can select them.

## 5. Actual Behavior
The doctor does NOT appear in `GET /api/appointment/doctors`. Inspecting the database shows `users.status = 'active'`, but `doctors.verification_status` remains `'PENDING'`.

```json
// Database record after approval:
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "active", // Updated
  "verification_status": "PENDING" // BUG: Never updated!
}
```

## 6. Root Cause Analysis
In `lumia-backend/controllers/admin.controller.js`, `approveDoctor` only executed:
```javascript
// admin.controller.js (Buggy implementation)
await db.query(`UPDATE users SET status = 'active' WHERE id = $1`, [docRes.rows[0].user_id]);
// Missing: UPDATE doctors SET verification_status = 'APPROVED' WHERE id = $1
```
The codebase previously relied on a temporary manual script (`scripts/approve_doctors.js`) to bulk update the `doctors` table, bypassing the primary API.

## 7. Fix Applied
Updated `admin.controller.js` to execute both database updates synchronously within the approval handler:
```javascript
// admin.controller.js (Fixed implementation)
await db.query(`UPDATE users SET status = 'active' WHERE id = $1`, [docRes.rows[0].user_id]);
await db.query(`UPDATE doctors SET verification_status = 'APPROVED' WHERE id = $1`, [doctorId]);
```

## 8. Verification & Test Evidence
- Verified via Jest API suite: `tests/api/admin.test.js` (`admin approves pending doctor: verification status updates and doctor appears in booking list`).
- Result: **Passed**.

