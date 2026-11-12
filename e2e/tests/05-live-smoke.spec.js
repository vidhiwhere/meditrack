const { test, expect } = require('@playwright/test');

const LIVE_FRONTEND_URL = 'https://meditrack-rouge.vercel.app';
const LIVE_BACKEND_URL = 'https://meditrack-zetl.onrender.com';

test.describe('Live Production Smoke Suite (Vercel & Render)', () => {
  // Generous timeout for Render free-tier cold spin-up
  test.setTimeout(120000);

  test('Render Backend Health Check responds with status 200', async ({ request }) => {
    const startTime = Date.now();
    console.log(`Pinging live Render health endpoint at ${LIVE_BACKEND_URL}/health...`);

    const res = await request.get(`${LIVE_BACKEND_URL}/health`, {
      timeout: 90000,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Render health check responded in ${duration}s with status ${res.status()}`);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toMatch(/Server is running/i);
  });

  test('Render Backend API Login works with demo patient credentials', async ({ request }) => {
    const res = await request.post(`${LIVE_BACKEND_URL}/api/auth/login`, {
      data: {
        email: 'patient1@lumia.com',
        password: 'pat123',
      },
      timeout: 90000,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.user.role).toBe('patient');
    expect(body.user.email).toBe('patient1@lumia.com');
  });

  test('Vercel Frontend loads login portal with demo access triggers', async ({ page }) => {
    await page.goto(`${LIVE_FRONTEND_URL}/login`, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify Brand title is rendered
    await expect(page.locator('h1:has-text("Lumia")')).toBeVisible({ timeout: 20000 });

    // Verify Demo Access buttons are present
    const demoAccess = page.locator('text=Demo Access');
    await expect(demoAccess).toBeVisible({ timeout: 20000 });

    const doctorDemoBtn = page.getByRole('button', { name: 'Doctor' });
    const patientDemoBtn = page.getByRole('button', { name: 'Patient' });
    const adminDemoBtn = page.getByRole('button', { name: 'Admin' });

    await expect(doctorDemoBtn).toBeVisible();
    await expect(patientDemoBtn).toBeVisible();
    await expect(adminDemoBtn).toBeVisible();
  });
});

