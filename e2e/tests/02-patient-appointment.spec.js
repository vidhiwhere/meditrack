const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('../helpers/auth.helper');

test.describe('E2E: Patient Appointment Booking Workflow', () => {
  test('Patient books an appointment and verifies it appears in appointment list', async ({ page }) => {
    // 1. Log in as patient
    await loginViaUI(page, 'patient');

    // 2. Navigate to Appointments page
    await page.goto('/patient/appointments');
    await page.waitForLoadState('domcontentloaded');

    // 3. Open Booking Form
    const bookBtn = page.getByRole('button', { name: /Book Appointment/i });
    await expect(bookBtn).toBeVisible({ timeout: 15000 });
    await bookBtn.click();

    // 4. Fill in appointment details
    const doctorSelect = page.locator('select.input-field');
    await expect(doctorSelect).toBeVisible();

    // Select the first available specialist option
    await doctorSelect.selectOption({ index: 1 });

    // Choose future date and unique time slot
    const randomDays = 15 + Math.floor(Math.random() * 30);
    const futureDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split('T')[0];
    const randomHour = String(10 + Math.floor(Math.random() * 6)).padStart(2, '0');
    const randomMinute = String(Math.floor(Math.random() * 50)).padStart(2, '0');
    const timeString = `${randomHour}:${randomMinute}`;

    const dateInput = page.locator('input[type="date"]');
    const timeInput = page.locator('input[type="time"]');
    const reasonInput = page.locator('input[placeholder*="Routine"]');

    await dateInput.fill(dateString);
    await timeInput.fill(timeString);
    const uniqueReason = `Playwright E2E Test Visit ${Date.now()}`;
    await reasonInput.fill(uniqueReason);

    // 5. Submit booking
    const confirmBtn = page.getByRole('button', { name: /Confirm Booking/i });
    await confirmBtn.click();

    // 6. Verify the new appointment appears in the patient's appointment list table
    const apptRow = page.locator(`table.data-table tbody tr:has-text("${uniqueReason}")`);
    await expect(apptRow.first()).toBeVisible({ timeout: 25000 });
    await expect(apptRow.first()).toContainText('BOOKED');
  });
});

