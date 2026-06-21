// tests/auth/landing.spec.js

import { test, expect } from '@playwright/test';

test.describe('PomoGrove Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the hero panel', async ({ page }) => {
    await expect(page.getByText('Plant your focus.')).toBeVisible();
  });

  test('renders email and password inputs', async ({ page }) => {
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.getByTestId('email-input').fill(process.env.TEST_EMAIL);
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('email-submit-btn').click();
    await expect(page.getByTestId('error-message')).toContainText('Incorrect');
  });

  test('successful sign-in leaves the landing page', async ({ page }) => {
    await page.getByTestId('email-input').fill(process.env.TEST_EMAIL);
    await page.getByTestId('password-input').fill(process.env.TEST_PASSWORD);
    await page.getByTestId('email-submit-btn').click();
    await expect(page.getByTestId('google-signin-btn')).not.toBeVisible();
  });

});