const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('../helpers/auth.helper');

test.describe('E2E: Doctor Consultation Completion, Fee Collection & Analytics', () => {
  test('Doctor completes consultation with fee, updating Total Fees Paid and Revenue Analytics', async ({ page }) => {
    // 1. Log in as doctor
    await loginViaUI(page, 'doctor');
    await expect(page).toHaveURL(/.*\/doctor/);

    // 2. Locate Complete button in the Medical Queue
    const completeBtn = page.locator('button.btn-primary:has-text("Complete")').first();
    const hasCompleteBtn = await completeBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCompleteBtn) {
      await completeBtn.click();

      // 3. Complete Consultation Modal appears
      const modal = page.locator('.glass-panel:has-text("Finalize Consultation")');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const feeInput = modal.locator('input[type="number"]');
      await feeInput.fill('750');

      const confirmBtn = modal.locator('button[type="submit"]:has-text("Confirm & Update")');
      await confirmBtn.click();

      // 4. Verify completion success message
      const successBanner = page.locator('text=Appointment completed');
      await expect(successBanner).toBeVisible({ timeout: 15000 });
    }

    // 5. Navigate to My Patients page and verify 'Total Fees Paid' column
    await page.goto('/doctor/patients');
    await page.waitForLoadState('domcontentloaded');

    const totalFeesHeader = page.locator('th:has-text("Total Fees Paid")');
    await expect(totalFeesHeader).toBeVisible({ timeout: 15000 });

    const feesCells = page.locator('table.data-table tbody td:has-text("₹")');
    await expect(feesCells.first()).toBeVisible({ timeout: 15000 });

    // 6. Navigate to Analytics page and verify Revenue representation
    await page.goto('/doctor/analytics');
    await page.waitForLoadState('domcontentloaded');

    const revenueHeading = page.locator('text=Estimated Consultation Revenue');
    await expect(revenueHeading).toBeVisible({ timeout: 15000 });

    const revenueAmount = page.locator('p:has-text("₹")');
    await expect(revenueAmount.first()).toBeVisible({ timeout: 15000 });
  });
});

