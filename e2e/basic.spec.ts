import { test, expect } from '@playwright/test';

test('has title and renders main components', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Uganda Campaign Tracker/i);

  // Check for main dashboard headings
  await expect(page.getByText('Uganda Campaign Tracker 🇺🇬')).toBeVisible();
  await expect(page.getByText('Upcoming Rallies')).toBeVisible();
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign In');
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});
