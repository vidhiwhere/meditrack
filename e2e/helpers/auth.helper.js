const fs = require('fs');
const path = require('path');

const CREDENTIALS = {
  doctor: {
    email: process.env.TEST_DOCTOR_EMAIL || 'doctor1@lumia.com',
    password: process.env.TEST_DOCTOR_PASSWORD || 'doc123',
    role: 'doctor',
    expectedPath: '/doctor',
  },
  patient: {
    email: process.env.TEST_PATIENT_EMAIL || 'patient1@lumia.com',
    password: process.env.TEST_PATIENT_PASSWORD || 'pat123',
    role: 'patient',
    expectedPath: '/patient',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@lumia.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    expectedPath: '/admin',
  },
};

const STATE_DIR = path.join(__dirname, '../.auth');

/**
 * Reusable UI login helper that logs in through the form
 */
async function loginViaUI(page, role = 'patient') {
  const creds = CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);

  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await emailInput.fill(creds.email);
  await passwordInput.fill(creds.password);
  await submitBtn.click();

  // Wait for redirect to portal dashboard
  await page.waitForURL(`**${creds.expectedPath}*`, { timeout: 25000 });
}

/**
 * Fast API-based authenticated session injector
 * Reuses saved storage state or generates an auth token via API
 */
async function loginAndSaveState(page, role = 'patient') {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }

  const statePath = path.join(STATE_DIR, `${role}-state.json`);
  await loginViaUI(page, role);
  await page.context().storageState({ path: statePath });
  return statePath;
}

module.exports = {
  CREDENTIALS,
  loginViaUI,
  loginAndSaveState,
  STATE_DIR,
};

