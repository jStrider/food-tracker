import { test, expect } from './helpers/authenticated-test';

test.describe('Authenticated tests example', () => {
  test('can access protected routes without login', async ({ page }) => {
    // Go directly to a protected route - no login needed!
    await page.goto('/foods');
    
    // Should NOT be redirected to login
    await expect(page).not.toHaveURL('/login');
    
    // Should see the foods page content
    await expect(page.getByRole('heading', { name: /foods/i })).toBeVisible();
  });

  test('user menu is already available', async ({ page }) => {
    await page.goto('/');
    
    // User button should be immediately visible - no login needed
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await expect(userButton).toBeVisible();
  });
});