import { test, expect } from '@playwright/test';

/**
 * Visual Regression Testing Suite
 * Captures and compares screenshots to detect visual changes
 * 
 * Features:
 * - Cross-browser visual testing
 * - Responsive layout validation
 * - Component-level screenshot testing
 * - Full-page screenshot comparisons
 * - Mobile and desktop viewport testing
 */

// Visual test configurations
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 667 },
};

const SCREENSHOT_OPTIONS = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  mode: 'default' as const,
};

test.describe('Visual Regression Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure consistent styling for visual tests
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Hide dynamic content for consistent screenshots */
        .skeleton, .loading { display: none !important; }
      `
    });
  });

  test.describe('Homepage Screenshots', () => {
    test('Homepage desktop layout', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for content to stabilize
      await page.waitForTimeout(1000);
      
      // Hide dynamic content
      await page.evaluate(() => {
        // Hide timestamps, dates, or other dynamic content
        document.querySelectorAll('[data-testid*="timestamp"], .relative-time').forEach(el => {
          el.textContent = 'Fixed Time';
        });
      });
      
      await expect(page).toHaveScreenshot('homepage-desktop.png', SCREENSHOT_OPTIONS);
    });

    test('Homepage tablet layout', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('homepage-tablet.png', SCREENSHOT_OPTIONS);
    });

    test('Homepage mobile layout', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', SCREENSHOT_OPTIONS);
    });
  });

  test.describe('Calendar Component Screenshots', () => {
    test('Calendar month view', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Ensure month view is active
      await page.getByRole('button', { name: 'Month' }).click();
      await page.waitForTimeout(500);
      
      // Screenshot the calendar component
      const calendar = page.locator('[data-testid="calendar-container"], .calendar-container').first();
      if (await calendar.isVisible()) {
        await expect(calendar).toHaveScreenshot('calendar-month-view.png', SCREENSHOT_OPTIONS);
      } else {
        // Fallback to full page if calendar container not found
        await expect(page).toHaveScreenshot('calendar-month-view-full.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Calendar week view', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('button', { name: 'Week' }).click();
      await page.waitForTimeout(500);
      
      const calendar = page.locator('[data-testid="calendar-container"], .calendar-container').first();
      if (await calendar.isVisible()) {
        await expect(calendar).toHaveScreenshot('calendar-week-view.png', SCREENSHOT_OPTIONS);
      } else {
        await expect(page).toHaveScreenshot('calendar-week-view-full.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Calendar day view', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('button', { name: 'Day' }).click();
      await page.waitForTimeout(500);
      
      const calendar = page.locator('[data-testid="calendar-container"], .calendar-container').first();
      if (await calendar.isVisible()) {
        await expect(calendar).toHaveScreenshot('calendar-day-view.png', SCREENSHOT_OPTIONS);
      } else {
        await expect(page).toHaveScreenshot('calendar-day-view-full.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Modal Components Screenshots', () => {
    test('Meal creation modal', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Open meal creation modal
      const today = new Date().getDate().toString();
      await page.getByText(today, { exact: true }).first().click();
      await page.getByRole('button', { name: 'Add Meal' }).click();
      
      // Wait for modal to be fully rendered
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(500);
      
      await expect(modal).toHaveScreenshot('meal-creation-modal.png', SCREENSHOT_OPTIONS);
    });

    test('Food search modal', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/foods');
      await page.waitForLoadState('networkidle');
      
      // If meal selection is required
      const mealSelect = page.locator('select, [role="combobox"]').first();
      if (await mealSelect.isVisible()) {
        await mealSelect.click();
        const options = page.locator('[role="option"], option').first();
        if (await options.isVisible()) {
          await options.click();
        }
      }
      
      // Search for food to open modal
      const searchInput = page.getByPlaceholder('Enter food name...');
      await searchInput.fill('apple');
      await page.waitForTimeout(1000);
      
      // Click on first result to open modal
      const firstResult = page.locator('.rounded-lg').first();
      if (await firstResult.isVisible()) {
        await firstResult.getByRole('button').first().click();
        
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          await expect(modal).toHaveScreenshot('food-add-modal.png', SCREENSHOT_OPTIONS);
        }
      }
    });
  });

  test.describe('Form Components Screenshots', () => {
    test('Login form', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      const loginForm = page.locator('form, .login-form').first();
      if (await loginForm.isVisible()) {
        await expect(loginForm).toHaveScreenshot('login-form.png', SCREENSHOT_OPTIONS);
      } else {
        await expect(page).toHaveScreenshot('login-page.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Registration form', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      const registerForm = page.locator('form, .register-form').first();
      if (await registerForm.isVisible()) {
        await expect(registerForm).toHaveScreenshot('registration-form.png', SCREENSHOT_OPTIONS);
      } else {
        await expect(page).toHaveScreenshot('registration-page.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Registration form with validation errors', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      // Trigger validation errors by submitting empty form
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
      
      // Check if errors are visible
      const errors = page.locator('.error, [role="alert"], .text-red-500');
      if (await errors.count() > 0) {
        const registerForm = page.locator('form, .register-form').first();
        if (await registerForm.isVisible()) {
          await expect(registerForm).toHaveScreenshot('registration-form-errors.png', SCREENSHOT_OPTIONS);
        }
      }
    });
  });

  test.describe('Food Search Screenshots', () => {
    test('Food search page', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/foods');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('food-search-page.png', SCREENSHOT_OPTIONS);
    });

    test('Food search with results', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/foods');
      await page.waitForLoadState('networkidle');
      
      // Search for food
      const searchInput = page.getByPlaceholder('Enter food name...');
      await searchInput.fill('apple');
      await page.waitForTimeout(1500); // Wait for debounce and results
      
      const searchResults = page.locator('[data-testid="search-results"], .search-results');
      if (await searchResults.isVisible()) {
        await expect(searchResults).toHaveScreenshot('food-search-results.png', SCREENSHOT_OPTIONS);
      } else {
        // If specific results container not found, screenshot full page
        await expect(page).toHaveScreenshot('food-search-with-results.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Navigation Screenshots', () => {
    test('Main navigation desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navigation = page.locator('nav, .navigation, [role="navigation"]').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveScreenshot('main-navigation-desktop.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Main navigation mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try to open mobile menu if it exists
      const menuButton = page.locator('[aria-label*="menu"], .menu-button, button:has-text("Menu")').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      
      const navigation = page.locator('nav, .navigation, [role="navigation"]').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveScreenshot('main-navigation-mobile.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Data Visualization Screenshots', () => {
    test('Nutrition summary cards', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on a date to show nutrition summary
      const today = new Date().getDate().toString();
      await page.getByText(today, { exact: true }).first().click();
      await page.waitForTimeout(500);
      
      const nutritionSummary = page.locator('[data-testid*="nutrition"], .nutrition-summary, .daily-summary').first();
      if (await nutritionSummary.isVisible()) {
        await expect(nutritionSummary).toHaveScreenshot('nutrition-summary.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Progress indicators', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const today = new Date().getDate().toString();
      await page.getByText(today, { exact: true }).first().click();
      await page.waitForTimeout(500);
      
      const progressBars = page.locator('[role="progressbar"], .progress, .progress-bar');
      const progressCount = await progressBars.count();
      
      if (progressCount > 0) {
        await expect(progressBars.first()).toHaveScreenshot('progress-indicators.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Error States Screenshots', () => {
    test('404 page', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      // Check if we have a 404 page or error message
      const errorContent = page.locator('text=/404|not found|error/i').first();
      if (await errorContent.isVisible()) {
        await expect(page).toHaveScreenshot('404-page.png', SCREENSHOT_OPTIONS);
      }
    });

    test('Network error state', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForTimeout(2000); // Wait for error to appear
      
      const errorMessage = page.locator('text=/error|failed|network/i').first();
      if (await errorMessage.isVisible()) {
        await expect(page).toHaveScreenshot('network-error-state.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Dark Mode Screenshots', () => {
    test('Homepage dark mode', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      
      // Enable dark mode if available
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if dark mode is actually applied
      const bodyClass = await page.locator('body').getAttribute('class');
      const htmlClass = await page.locator('html').getAttribute('class');
      
      if (bodyClass?.includes('dark') || htmlClass?.includes('dark')) {
        await expect(page).toHaveScreenshot('homepage-dark-mode.png', SCREENSHOT_OPTIONS);
      }
    });
  });

  test.describe('Cross-browser Visual Consistency', () => {
    // Note: These tests would typically run with different browser projects
    // defined in playwright.config.ts
    
    test('Homepage consistency check', async ({ page, browserName }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take browser-specific screenshot
      await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, SCREENSHOT_OPTIONS);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // If test failed, take a full page screenshot for debugging
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({
        path: `test-results/failures/${testInfo.title.replace(/\s+/g, '-')}-failure.png`,
        fullPage: true,
      });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  });
});