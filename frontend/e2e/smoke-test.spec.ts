import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login page elements are present
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('Can navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on sign up link
    await page.getByText(/sign up/i).click();
    
    // Should be on registration page
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  });

  test('Login form validation works', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should still be on login page (form prevents submission)
    await expect(page).toHaveURL('/login');
  });
});