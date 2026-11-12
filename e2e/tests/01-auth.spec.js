const { test, expect } = require('@playwright/test');
const { loginViaUI, CREDENTIALS } = require('../helpers/auth.helper');

test.describe('E2E: Authentication & Role Protection', () => {
  test('Role Protection: Logged-out user visiting /patient must redirect to /login', async ({ page }) => {
    await page.goto('/patient');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Role Protection: Logged-out user visiting /doctor must redirect to /login', async ({ page }) => {
    await page.goto('/doctor');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Role Protection: Logged-out user visiting /admin must redirect to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Login Flow: Doctor logs in and loads Doctor Dashboard', async ({ page }) => {
    await loginViaUI(page, 'doctor');
    await expect(page).toHaveURL(/.*\/doctor/);
    await expect(page.locator('text=Medical Queue')).toBeVisible({ timeout: 15000 });
  });

  test('Login Flow: Patient logs in and loads Patient Portal', async ({ page }) => {
    await loginViaUI(page, 'patient');
    await expect(page).toHaveURL(/.*\/patient/);
  });

  test('Login Flow: Admin logs in and loads Admin Dashboard', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('Negative Login: Invalid password displays error message in UI', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('doctor1@lumia.com');
    await page.locator('input[type="password"]').fill('wrong_password_999');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.locator('.glass-panel div:has-text("Invalid credentials"), div:has-text("failed")');
    await expect(errorAlert.first()).toBeVisible({ timeout: 15000 });
  });
});

