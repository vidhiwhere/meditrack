const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://meditrack-rouge.vercel.app';

module.exports = defineConfig({
  testDir: './e2e/tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

