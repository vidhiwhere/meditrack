# Lumia Wellness Healthcare Platform

A modern, full-stack healthcare platform designed to streamline the consultation workflow between doctors and patients. It offers distinct portals for patients (to book appointments), doctors (to manage appointments, issue prescriptions, and track revenue), and administrators (to verify doctors and oversee the platform).

## 🚀 Live Deployment

- **Frontend App**: [https://meditrack-rouge.vercel.app](https://meditrack-rouge.vercel.app)
- **Backend API**: [https://meditrack-zetl.onrender.com](https://meditrack-zetl.onrender.com)

### Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Doctor** | `doctor1@lumia.com` | `doc123` |
| **Patient** | `patient1@lumia.com` | `pat123` |
| **Admin** | `admin@lumia.com` | `admin123` |

---

## ✨ Features

### 👨‍⚕️ Doctor Portal
- **Dashboard**: View upcoming appointments and securely mark them as completed with custom fee collection.
- **My Patients CRM**: An organized view of all patients, tracking comprehensive details including the 'Total Fees Paid' by each patient.
- **Analytics**: Track total revenue, patient count, and consultation trends with visual data representation.

### 🧑 Patient Portal
- **Appointments**: Effortlessly book, reschedule, or cancel consultations with verified doctors.
- **Health Records**: View digital prescriptions and post-visit notes.

---

## 📸 Platform Screenshots

### Secure Login
![Login Page](./docs/screenshots/login_page.png)
*Role-based secure authentication system for Doctors, Patients, and Admins.*

### Doctor Dashboard
![Doctor Dashboard](./docs/screenshots/doctor_dashboard.png)
*A premium, organized view of the day's appointments and vital statistics.*

### Interactive Fee Collection (Consultation Completion)
![Fee Collection](./docs/screenshots/fee_modal.png)
*A custom modal for doctors to quickly record consultation fees upon completing an appointment, automatically updating analytics.*

### Revenue Analytics
![Analytics](./docs/screenshots/doctor_analytics.png)
*Real-time tracking of patient flow and revenue generation.*


---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide React icons, and a custom CSS design system optimized for a premium wellness aesthetic.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (hosted on Neon.tech).
- **Deployment & Cloud**:
  - **Vercel** (Frontend SPA with custom routing).
  - **Render** (Node.js backend with automated migrations on boot).

---

## 💻 Local Development Setup

### Project Structure
The project is organized into a monorepo setup containing the frontend and backend architectures:
- `/lumia-frontend` - React Vite application.
- `/lumia-backend` - Node.js Express server.

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 1. Backend Setup
\`\`\`bash
cd lumia-backend
npm install
\`\`\`
Create a `.env` file based on the provided `.env.example` and add your local PostgreSQL `DATABASE_URL`.
\`\`\`bash
# Start the server (runs on port 3000 by default)
# Note: Migrations will run automatically on boot if DB is empty
npm run dev
\`\`\`

### 2. Frontend Setup
\`\`\`bash
cd lumia-frontend
npm install
\`\`\`
Ensure your local `VITE_API_BASE` points to `http://localhost:3000/api`.
\`\`\`bash
npm run dev
\`\`\`

---

## 🧪 Testing

The platform features an automated quality engineering suite covering backend API tests, Playwright end-to-end user journeys, live deployment smoke tests, and k6 load tests.

For an in-depth breakdown of test scenarios and traceability, see [TEST_PLAN.md](file:///c:/Users/vidhi/Documents/meditrack/TEST_PLAN.md).

### 1. Prerequisites & Installation

Install dependencies across the monorepo and backend:
\`\`\`bash
# Install root dependencies (including Playwright)
npm install

# Install backend dependencies (including Jest and Supertest)
cd lumia-backend && npm install && cd ..
\`\`\`

Install Playwright Chromium browser binaries:
\`\`\`bash
npx playwright install chromium
\`\`\`

---

### 2. Test Database Setup & Test Data

Tests do **not** run against the live production Neon database to prevent demo data pollution.

#### Option A: Dockerized PostgreSQL (Recommended for Local DB)
A dedicated `docker-compose.test.yml` is provided on port `5433`:
\`\`\`bash
# Start isolated PostgreSQL 16 container
docker compose -f docker-compose.test.yml up -d

# Set environment variable pointing to the test DB
export TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5433/meditrack_test?sslmode=disable"
\`\`\`

#### Option B: Zero-Config In-Memory Database (`pg-mem`)
If no external database is configured, the test suite automatically boots an isolated, in-memory PostgreSQL engine (`pg-mem`) with identical schema and functions. No Docker or PostgreSQL installation is required!

#### Seed / Reset Test Data
Reset and seed deterministic fixtures (Admin, Doctors, Patients, Appointments):
\`\`\`bash
npm run test:seed
# or directly in backend:
cd lumia-backend && npm run db:reset:test
\`\`\`

---

### 3. Running API Tests (Jest + Supertest)

Run the complete 60-test API suite covering Auth, RBAC, Appointments, Consultations & Fees, Admin verification, and Schema validation:
\`\`\`bash
# Run all backend API tests
npm run test:api

# Run with test coverage report
cd lumia-backend && npm run test:coverage
\`\`\`

---

### 4. Running Playwright End-to-End Tests

The Playwright suite verifies real end-to-end user workflows with reusable login state caching and role protection guards:
\`\`\`bash
# Run all E2E tests headless
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui

# Run in headed browser mode
npm run test:e2e:headed

# View HTML Test Report and failure screenshots
npm run test:report
\`\`\`

---

### 5. Live Production Smoke Test

Run a quick health and connectivity check against the live Vercel frontend and Render backend:
\`\`\`bash
npm run test:smoke:live
\`\`\`

> [!NOTE]
> **Render Free-Tier Sleep Notice:** The live backend on Render's free tier spins down after inactivity. Cold starts can take 30–50 seconds on the first request. The live smoke test suite is configured with generous 90–120s timeouts to prevent false alarms and distinguish environmental wake-up delays from actual product bugs.

---

### 6. Performance & Load Testing (k6)

Simulate 20 concurrent virtual users hitting the login flow and appointments directory:
\`\`\`bash
# Run k6 load test against Render API (or local backend)
k6 run load-tests/k6-load-test.js

# Or against local backend:
k6 run -e TARGET_URL="http://localhost:3000" load-tests/k6-load-test.js
\`\`\`

---

### 7. Continuous Integration (GitHub Actions)

Every pull request and push to `main` runs the automated CI pipeline defined in `.github/workflows/ci.yml`:
- Starts an isolated PostgreSQL 16 service container.
- Installs dependencies and runs schema migrations & test seeders.
- Executes the Jest + Supertest API test suite.
- Runs the Playwright End-to-End test suite.
- Automatically captures and uploads Playwright failure reports, traces, and screenshots as build artifacts.

---

### 8. Bug Reports
Real defects discovered and resolved during quality engineering are documented under [`docs/bug-reports/`](file:///c:/Users/vidhi/Documents/meditrack/docs/bug-reports/):
- [BUG-001: Admin Doctor Approval Verification Status Desync](file:///c:/Users/vidhi/Documents/meditrack/docs/bug-reports/BUG-001-admin-doctor-verification-desync.md)
- [BUG-002: BOLA Vulnerability in Appointment Cancellation](file:///c:/Users/vidhi/Documents/meditrack/docs/bug-reports/BUG-002-bola-appointment-cancellation.md)

