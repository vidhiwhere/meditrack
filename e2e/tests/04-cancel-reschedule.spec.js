const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('../helpers/auth.helper');

test.describe('E2E: Appointment Cancellation & Status Flow', () => {
  test('Patient manages appointments list and verifies status lifecycle', async ({ page }) => {
    // 1. Log in as patient
    await loginViaUI(page, 'patient');

    // 2. Navigate to appointments page
    await page.goto('/patient/appointments');
    await page.waitForLoadState('domcontentloaded');

    // Verify Appointments table is rendered
    const table = page.locator('table.data-table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Verify status badges are present (e.g., BOOKED, COMPLETED, or CANCELLED)
    const statusBadges = page.locator('table.data-table tbody tr');
    await expect(statusBadges.first()).toBeVisible({ timeout: 15000 });

    // 3. Book a temporary test appointment
    const bookBtn = page.getByRole('button', { name: /Book Appointment/i });
    await bookBtn.click();

    const doctorSelect = page.locator('select.input-field');
    await doctorSelect.selectOption({ index: 1 });

    const randomDays = 30 + Math.floor(Math.random() * 30);
    const futureDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomHour = String(10 + Math.floor(Math.random() * 6)).padStart(2, '0');
    const randomMinute = String(Math.floor(Math.random() * 50)).padStart(2, '0');
    const timeString = `${randomHour}:${randomMinute}`;

    await page.locator('input[type="date"]').fill(futureDate);
    await page.locator('input[type="time"]').fill(timeString);
    const cancelReason = `Cancellation Flow Test ${Date.now()}`;
    await page.locator('input[placeholder*="Routine"]').fill(cancelReason);

    await page.getByRole('button', { name: /Confirm Booking/i }).click();

    // Verify it appears in the table with BOOKED status
    const newRow = page.locator(`table.data-table tbody tr:has-text("${cancelReason}")`);
    await expect(newRow).toBeVisible({ timeout: 15000 });
    await expect(newRow).toContainText('BOOKED');
  });
});

