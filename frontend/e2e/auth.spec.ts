import { test, expect } from './helpers/authenticated-test';
import { test as baseTest } from '@playwright/test';

test.describe('Authentication', () => {
  // This test uses authenticated context, so it should already be logged in
  test('is already authenticated', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Verify we're on the home page (not redirected to login)
    await expect(page).toHaveURL('/');
    
    // Verify navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Verify user menu is present (shows we're logged in)
    // The user button contains a User icon
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await expect(userButton).toBeVisible();
  });

  // This test needs to use base test without authentication
  baseTest('redirects to login when not authenticated', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/foods');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    
    // Login form should be visible
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('can logout', async ({ page }) => {
    // Already logged in via authenticated context
    await page.goto('/');
    
    // Click user menu
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await userButton.click();
    
    // Click logout
    await page.getByText('Log out').click();
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});