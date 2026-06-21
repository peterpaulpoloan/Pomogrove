// tests/dashboard.spec.js
import { test, expect } from '@playwright/test';

async function signIn(page) {
  await page.goto('/');
  await page.getByTestId('email-input').fill(process.env.TEST_EMAIL);
  await page.getByTestId('password-input').fill(process.env.TEST_PASSWORD);
  await page.getByTestId('email-submit-btn').click();
  await expect(page.getByText('Focus Sessions')).toBeVisible({ timeout: 10000 });
}

test.describe('PomoGrove Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  test.describe('Layout', () => {
    test('renders the profile image in the dashboard section', async ({ page }) => {
      // Target the larger profile image specifically (w-32 h-32) inside main
      await expect(page.locator('main img[alt="Profile"], section img[alt="Profile"]').last()).toBeVisible();
    });

    test('renders the three stat cards', async ({ page }) => {
      await expect(page.getByText('Focus Sessions')).toBeVisible();
      await expect(page.getByText('Current Streak')).toBeVisible();
      await expect(page.getByText('Trees Grown')).toBeVisible();
    });

    test('renders the activity calendar section', async ({ page }) => {
      await expect(page.locator('section').last()).toBeVisible();
    });

    test('renders the level badge', async ({ page }) => {
      await expect(page.getByText(/Level \d+/)).toBeVisible();
    });

    test('renders the streak badge', async ({ page }) => {
      await expect(page.getByText(/\d+ Day Streak/)).toBeVisible();
    });
  });

  // ── Profile editing ───────────────────────────────────────────────────────

  test.describe('Profile editing', () => {
    // The edit button sits next to the user's display name — scope to that area
    async function clickEditButton(page) {
      // The edit/save button is next to the h2 name heading
      await page.locator('h2 ~ button, h2 + button').click();
    }

    test('clicking edit shows name input and bio textarea', async ({ page }) => {
      await clickEditButton(page);
      // Name input appears (replaces the h2)
      await expect(page.locator('input[class*="text-3xl"]')).toBeVisible();
      // Bio textarea appears
      await expect(page.locator('textarea')).toBeVisible();
    });

    test('can edit and save display name', async ({ page }) => {
      await clickEditButton(page);

      const nameInput = page.locator('input[class*="text-3xl"]');
      await nameInput.clear();
      await nameInput.fill('New Test Name');

      // Click save (same button, now shows Save icon)
      await page.locator('h2 ~ button, input[class*="text-3xl"] ~ button').click();

      await expect(page.getByRole('heading', { name: 'New Test Name' })).toBeVisible();
      await expect(page.locator('input[class*="text-3xl"]')).not.toBeVisible();
    });

    test('can edit and save bio', async ({ page }) => {
      await clickEditButton(page);

      const bioTextarea = page.locator('textarea');
      await bioTextarea.clear();
      await bioTextarea.fill('My new study bio.');

      await page.locator('button:has(svg)').filter({ hasText: '' }).nth(1).click();

      await expect(page.getByText('My new study bio.')).toBeVisible();
      await expect(page.locator('textarea')).not.toBeVisible();
    });

    test('switches back to view mode after saving', async ({ page }) => {
      await clickEditButton(page);
      await expect(page.locator('textarea')).toBeVisible();

      // Save
      await page.locator('input[class*="text-3xl"] ~ button, h2 ~ button').click();
      await expect(page.locator('textarea')).not.toBeVisible();
    });
  });

  // ── Stat cards ────────────────────────────────────────────────────────────

  test.describe('Stat cards', () => {
    test('focus sessions card shows a number', async ({ page }) => {
      // Scope tightly: the p directly inside the Focus Sessions card
      const value = page.locator('div:has(> p:text("Focus Sessions")) p.text-2xl');
      await expect(value).toBeVisible();
      const text = await value.innerText();
      expect(Number(text)).not.toBeNaN();
    });

    test('current streak card shows days', async ({ page }) => {
      await expect(page.getByText(/\d+ Days/).first()).toBeVisible();
    });

    test('trees grown card shows a non-negative number', async ({ page }) => {
      const value = page.locator('div:has(> p:text("Trees Grown")) p.text-2xl');
      await expect(value).toBeVisible();
      const text = await value.innerText();
      expect(Number(text)).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Responsive ────────────────────────────────────────────────────────────

  test.describe('Responsive layout', () => {
    test('renders correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.getByText('Focus Sessions')).toBeVisible();
    });

    test('renders correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(page.getByText('Focus Sessions')).toBeVisible();
      // Target the large dashboard profile image specifically
      await expect(page.locator('img.w-32')).toBeVisible();
    });
  });

});