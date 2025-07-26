import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(/Food Tracker/);
  });

  test('displays navigation menu', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Food Search' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Goals' })).toBeVisible();
  });

  test('shows calendar view by default', async ({ page }) => {
    await expect(page.getByText('Food Tracker Calendar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
  });

  test('can switch between month and week view', async ({ page }) => {
    // Start in month view
    await expect(page.getByTestId('month-view')).toBeVisible();
    
    // Switch to week view
    await page.getByRole('button', { name: 'Week' }).click();
    await expect(page.getByTestId('week-view')).toBeVisible();
    
    // Switch back to month view
    await page.getByRole('button', { name: 'Month' }).click();
    await expect(page.getByTestId('month-view')).toBeVisible();
  });

  test('displays current date', async ({ page }) => {
    const today = new Date();
    const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(page.getByText(monthYear)).toBeVisible();
  });
});