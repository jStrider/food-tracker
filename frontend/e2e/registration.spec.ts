import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
  });

  test('displays registration form with all required elements', async ({ page }) => {
    // Check page title and description
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
    await expect(page.getByText('Start tracking your nutrition today')).toBeVisible();

    // Check form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Check login link
    await expect(page.getByText('Already have an account?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('successfully registers a new user', async ({ page }) => {
    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;

    // Fill in the registration form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Submit the form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for navigation to home page
    await expect(page).toHaveURL('/');

    // Verify user is logged in by checking for navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Look for user menu button (contains User icon)
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await expect(userButton).toBeVisible();

    // Click user menu to verify user info
    await userButton.click();
    
    // Verify logout option is available
    await expect(page.getByText('Log out')).toBeVisible();
  });

  test('shows error when email already exists', async ({ page }) => {
    // First, register a user
    const timestamp = Date.now();
    const existingEmail = `existing${timestamp}@example.com`;

    await page.getByLabel('Name').fill('First User');
    await page.getByLabel('Email').fill(existingEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for successful registration
    await expect(page).toHaveURL('/');

    // Logout
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await userButton.click();
    await page.getByText('Log out').click();

    // Try to register with the same email
    await page.goto('/register');
    await page.getByLabel('Name').fill('Second User');
    await page.getByLabel('Email').fill(existingEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for error toast
    await expect(page.getByText(/already exists/i)).toBeVisible();
    
    // Verify we're still on the registration page
    await expect(page).toHaveURL('/register');
  });

  test('validates password mismatch', async ({ page }) => {
    // Fill form with mismatched passwords
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('different456');

    // Handle the alert dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Passwords do not match');
      dialog.accept();
    });

    // Submit the form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify we're still on the registration page
    await expect(page).toHaveURL('/register');
  });

  test('validates required fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check HTML5 validation messages (browser native)
    const nameInput = page.getByLabel('Name');
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password', { exact: true });

    // Verify that validation is triggered (fields should have validation errors)
    await expect(nameInput).toHaveAttribute('required');
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('validates email format', async ({ page }) => {
    // Fill form with invalid email
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // The browser should show validation error for email field
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Try to submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should still be on register page due to HTML5 email validation
    await expect(page).toHaveURL('/register');
  });

  test('validates minimum password length', async ({ page }) => {
    // Fill form with short password
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await page.getByLabel('Confirm Password').fill('short');

    // Check that password fields have minLength attribute
    const passwordInput = page.getByLabel('Password', { exact: true });
    const confirmPasswordInput = page.getByLabel('Confirm Password');
    
    await expect(passwordInput).toHaveAttribute('minLength', '6');
    await expect(confirmPasswordInput).toHaveAttribute('minLength', '6');

    // The browser should prevent submission due to minLength validation
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should still be on register page
    await expect(page).toHaveURL('/register');
  });

  test('navigates to login page via sign in link', async ({ page }) => {
    // Click the sign in link
    await page.getByRole('link', { name: 'Sign in' }).click();

    // Verify navigation to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to FoodTracker' })).toBeVisible();
  });

  test('shows loading state during registration', async ({ page }) => {
    // Fill in the form
    const timestamp = Date.now();
    const testEmail = `loading${timestamp}@example.com`;

    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Intercept the API call to add delay
    await page.route('**/auth/register', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    // Click submit
    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await submitButton.click();

    // Check for loading state
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('.animate-spin')).toBeVisible();

    // Wait for completion
    await expect(page).toHaveURL('/');
  });

  test('persists authentication after page refresh', async ({ page }) => {
    // Register a new user
    const timestamp = Date.now();
    const testEmail = `refresh${timestamp}@example.com`;

    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for successful registration
    await expect(page).toHaveURL('/');

    // Refresh the page
    await page.reload();

    // Verify user is still logged in
    await expect(page).toHaveURL('/');
    const userButton = page.locator('button').filter({ has: page.locator('svg.lucide-user') });
    await expect(userButton).toBeVisible();
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/auth/register', route => {
      route.abort('failed');
    });

    // Fill and submit form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('network@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for error toast
    await expect(page.getByText(/failed/i)).toBeVisible();

    // Verify we're still on registration page
    await expect(page).toHaveURL('/register');

    // Form should be enabled again
    await expect(page.getByLabel('Name')).toBeEnabled();
    await expect(page.getByLabel('Email')).toBeEnabled();
  });
});