import { Page } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export async function loginUser(page: Page, email: string = 'test@example.com', password: string = 'password123') {
  // Go to login page
  await page.goto('/login');
  
  // Wait for login form to be ready
  await page.waitForSelector('#email', { state: 'visible' });
  
  // Fill login form
  await page.fill('#email', email);
  await page.fill('#password', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to home page after successful login
  await page.waitForURL('/', { timeout: 15000 });
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Ensure the navigation is visible (indicates successful login)
  await page.waitForSelector('nav', { state: 'visible', timeout: 5000 });
}

export async function registerAndLogin(page: Page, email: string, name: string, password: string) {
  // Go to register page
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('input[name="name"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to home page after successful registration
  await page.waitForURL('/', { timeout: 10000 });
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
}

export async function createAuthenticatedContext(page: Page) {
  // This creates a test user and logs them in
  // In a real test environment, you might want to:
  // 1. Use a test database that gets reset
  // 2. Create a specific test user via API
  // 3. Use environment-specific test credentials
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testName = 'Test User';
  const testPassword = 'password123';
  
  // Try to register and login
  // If registration fails (user already exists), just login
  try {
    await registerAndLogin(page, testEmail, testName, testPassword);
  } catch (error) {
    // If registration fails, try to login with default test credentials
    await loginUser(page, 'test@example.com', 'password123');
  }
}