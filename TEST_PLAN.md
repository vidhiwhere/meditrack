# Master Test Plan — Lumia Wellness Healthcare Platform (Meditrack)

## 1. Executive Summary
This document outlines the end-to-end Quality Engineering and Testing strategy for the **Lumia Wellness Healthcare Platform**. It details the automated test architecture, coverage scenarios, test environments, risk mitigations, and CI/CD pipelines.

The platform provides role-based healthcare services for **Patients**, **Doctors**, and **Administrators**, handling appointment scheduling, consultation completions with custom fee collection, clinical analytics, and administrative verification.

---

## 2. Testing Scope & Architecture

```
                                  ┌───────────────────────────────┐
                                  │       GitHub Actions CI       │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │    Backend API Suite      │                                     │      Playwright E2E       │
   │    (Jest + Supertest)     │                                     │    (Headless Chromium)    │
   └─────────────┬─────────────┘                                     └─────────────┬─────────────┘
                 │                                                                 │
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │ Test Database Isolation   │                                     │  End-to-End User Journeys │
   │ (PostgreSQL / pg-mem)     │                                     │  (Patient/Doctor/Admin)   │
   └───────────────────────────┘                                     └───────────────────────────┘
```

---

## 3. Test Suites & Scenario Coverage Matrix

### 3.1 Backend API Tests (`lumia-backend/tests/api/`)
*Framework: Jest + Supertest (60 Automated Tests, 100% Passing)*

| Group | Test File | Scenarios Covered | Case Types |
| :--- | :--- | :--- | :--- |
| **Authentication** | `tests/api/auth.test.js` | • Valid logins for all roles (Doctor, Patient, Admin)<br>• Wrong password rejection (401)<br>• Unknown email rejection (401)<br>• Missing email/password validation (400)<br>• Inactive/pending doctor login rejection (401)<br>• Expired JWT rejection (401)<br>• Tampered/invalid JWT signature rejection (401)<br>• Missing Authorization header rejection (401) | Positive, Negative, Security |
| **Role-Based Access (RBAC)** | `tests/api/rbac.test.js` | • Patient blocked from doctor queue & analytics (403)<br>• Patient blocked from admin portal (403)<br>• Doctor blocked from admin operations (403)<br>• Doctor 1 cannot see Doctor 2 patients or revenue<br>• Doctor 1 blocked from Doctor 2 appointments (403)<br>• Patient 1 blocked from Patient 2 appointments (403) | Security, Data Isolation, Privacy |
| **Appointments** | `tests/api/appointments.test.js` | • Valid future appointment booking (201)<br>• Past date booking rejection (400)<br>• Non-existent doctor rejection (404)<br>• Double booking of same slot & doctor rejection (409)<br>• Patient and Doctor appointment roster listing (200)<br>• Appointment rescheduling to valid future slot (200)<br>• Rescheduling to past date rejection (400)<br>• Rescheduling someone else's appointment rejection (403)<br>• Cancelling someone else's appointment rejection (403)<br>• Patient cancels own appointment (200, status CANCELLED) | Positive, Negative, Concurrency |
| **Consultations & Fees** | `tests/api/consultations.test.js` | • Doctor marks appointment COMPLETED with fee (200)<br>• Practice analytics update (completed count & revenue)<br>• **Boundary:** Fee of ₹0 accepted for free follow-up (200)<br>• **Boundary:** Negative fee rejected (400)<br>• **Boundary:** Non-numeric fee rejected (400)<br>• **Boundary:** Fee exceeding upper limit rejected (400)<br>• **Boundary:** Completing already completed appointment (400)<br>• Doctor B cannot complete Doctor A appointment (403) | Business Logic, Boundary Values |
| **Admin Oversight** | `tests/api/admin.test.js` | • Unverified doctor omitted from patient booking list<br>• Admin lists pending registrations (200)<br>• Admin approves doctor: status updates to APPROVED<br>• Newly approved doctor appears in patient booking list<br>• Audit trail recorded in `dpdp_audit_logs`<br>• Admin rejects doctor: doctor omitted from booking list<br>• Platform analytics overview (200) | Integration, Workflow |
| **Schema Validation** | `tests/api/schema.test.js` | • Health check schema `{ status: string, timestamp: string }`<br>• Login response schema `{ accessToken, refreshToken, user: { id, email, role } }`<br>• Uniform error schema `{ error: string }` on 400/401/403/404<br>• Appointment schema typed assertions (UUID, ISO date, enum status)<br>• Analytics schema strictly typed numerical counters | Contract Testing |

---

### 3.2 Playwright End-to-End Tests (`e2e/tests/`)
*Framework: Playwright Test (Chromium Engine, 13 Automated Tests, 100% Passing)*

| Suite | File | Flow Description |
| :--- | :--- | :--- |
| **Role Auth & Guards** | `e2e/tests/01-auth.spec.js` | • Logged-out user visiting `/patient`, `/doctor`, or `/admin` is redirected to `/login`<br>• Doctor login loads `/doctor` Medical Queue dashboard<br>• Patient login loads `/patient` portal<br>• Admin login loads `/admin` dashboard<br>• Invalid credentials displays error alert in UI |
| **Patient Booking** | `e2e/tests/02-patient-appointment.spec.js` | • Patient navigates to `/patient/appointments`<br>• Opens booking modal, selects specialist, selects future date/time, enters reason<br>• Submits booking form, verifies appointment appears in the data table with `BOOKED` status |
| **Doctor Revenue** | `e2e/tests/03-doctor-consultation-revenue.spec.js` | • Doctor reviews patient queue, clicks `Complete`<br>• Enters consultation fee in modal, confirms<br>• Navigates to `/doctor/patients`, verifies `Total Fees Paid` column updates<br>• Navigates to `/doctor/analytics`, verifies `Estimated Consultation Revenue` updates |
| **Cancellation Flow** | `e2e/tests/04-cancel-reschedule.spec.js` | • Tests patient appointment list view, status badges, and appointment booking lifecycle |
| **Live Smoke Test** | `e2e/tests/05-live-smoke.spec.js` | • Hits Render Backend `/health` (verifies cold-start resilience & 200 OK)<br>• Hits Render Backend `/api/auth/login` (verifies live auth)<br>• Hits Vercel Frontend `/login` (verifies live SPA rendering and demo access triggers) |

---

### 3.3 Performance & Load Testing (`load-tests/`)
*Framework: k6 by Grafana*

- **Target:** Authentication (`POST /api/auth/login`) and Appointments Listing (`GET /api/appointment/list`).
- **Traffic Pattern:** 20 concurrent Virtual Users (VUs) with ramp-up and ramp-down stages.
- **Thresholds:**
  - $p(95) < 800\text{ ms}$ response latency.
  - Error rate $< 2\%$.

---

## 4. Test Environments & Database Strategy

1. **Test Database Isolation**:
   - To avoid polluting production or demo data, tests do **not** run against live Neon production instances.
   - **Local Docker Environment**: `docker-compose.test.yml` provides an isolated PostgreSQL 16 container on port 5433.
   - **CI Environment**: GitHub Actions provisions a dedicated `postgres:16-alpine` service container.
   - **Zero-Dependency Fallback**: `pg-mem` in-memory database allows instant local execution of Jest tests without running external services.
2. **Deterministic Test Seeding**:
   - `resetTestDb()` wipes all tables and seeds known deterministic fixtures before test runs (Admin, Approved Doctors, Pending Doctors, Patients, and baseline Appointments).
   - Can be triggered manually via `npm run test:seed`.

---

## 5. Defect Reports Summary
During the development and execution of the automated test suites, three genuine defects were uncovered and resolved:

1. **BUG-001**: Admin Doctor Approval Failed to Update Verification Status in `doctors` Table (`docs/bug-reports/BUG-001-admin-doctor-verification-desync.md`).
2. **BUG-002**: Broken Object Level Authorization (BOLA) in Appointment Cancellation & Reschedule (`docs/bug-reports/BUG-002-bola-appointment-cancellation.md`).
3. **BUG-003**: Correlated Subquery SQL Failure on Doctor Patient Roster Query (`services/doctor/doctor.service.js`).

