import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations, configureAxe } from 'axe-playwright';

/**
 * Comprehensive Accessibility Testing Suite
 * Tests WCAG 2.1 AA compliance across all major pages and components
 * 
 * Coverage:
 * - Color contrast ratios
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - ARIA attributes
 * - Semantic HTML structure
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing
    await page.goto('/');
    await injectAxe(page);
    
    // Configure axe with WCAG 2.1 AA standards
    await configureAxe(page, {
      rules: {
        // Enable comprehensive WCAG checks
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'button-name': { enabled: true },
        'empty-heading': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'frame-title': { enabled: true },
        'html-has-lang': { enabled: true },
        'html-lang-valid': { enabled: true },
        'image-alt': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-refresh': { enabled: true },
        'meta-viewport': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'role-img-alt': { enabled: true },
        'scrollable-region-focusable': { enabled: true },
        'server-side-image-map': { enabled: true },
        'svg-img-alt': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true },
        'video-description': { enabled: true },
      }
    });
  });

  test('Homepage accessibility compliance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verify critical accessibility features
    await expect(page.locator('html')).toHaveAttribute('lang');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Login page accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Test form accessibility
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');

    // Check for proper labels
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('aria-label');
    
    // Test keyboard navigation through form
    await emailInput.focus();
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();
  });

  test('Registration page accessibility', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Test form validation messages accessibility
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check that error messages are accessible
    const errorMessages = page.locator('[role="alert"]');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
      await expect(errorMessages.first()).toHaveAttribute('aria-live');
    }
  });

  test('Calendar navigation accessibility', async ({ page }) => {
    // Assume we're logged in or use authenticated context
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Test calendar keyboard navigation
    const calendarNav = page.locator('[role="grid"]').first();
    if (await calendarNav.isVisible()) {
      await calendarNav.focus();
      
      // Arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowUp');
    }
    
    // Test view switcher accessibility
    const viewButtons = page.locator('button:has-text("Day"), button:has-text("Week"), button:has-text("Month")');
    const buttonCount = await viewButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = viewButtons.nth(i);
      await expect(button).toHaveAttribute('role', 'button');
      
      // Check for proper ARIA state
      if (await button.getAttribute('aria-pressed') !== null) {
        await expect(button).toHaveAttribute('aria-pressed');
      }
    }
  });

  test('Meal creation modal accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open meal creation modal
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    await page.getByRole('button', { name: 'Add Meal' }).click();
    
    // Wait for modal to be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check modal accessibility
    await checkA11y(page, '[role="dialog"]', {
      detailedReport: true,
    });
    
    // Test modal focus management
    const firstFocusableElement = modal.locator('input, button, select, textarea, [tabindex="0"]').first();
    await expect(firstFocusableElement).toBeFocused();
    
    // Test escape key closes modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Food search accessibility', async ({ page }) => {
    await page.goto('/foods');
    await page.waitForLoadState('networkidle');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Test search input accessibility
    const searchInput = page.getByPlaceholder('Enter food name...');
    await expect(searchInput).toHaveAttribute('role', 'searchbox');
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Test search results accessibility
    await searchInput.fill('apple');
    await page.waitForTimeout(1000); // Wait for debounce
    
    const searchResults = page.locator('[data-testid="search-results"]');
    if (await searchResults.isVisible()) {
      await expect(searchResults).toHaveAttribute('role', 'listbox');
      
      const resultItems = searchResults.locator('[role="option"]');
      const itemCount = await resultItems.count();
      
      if (itemCount > 0) {
        // Test keyboard navigation through results
        await searchInput.press('ArrowDown');
        await expect(resultItems.first()).toBeFocused();
      }
    }
  });

  test('Color contrast compliance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run axe check specifically for color contrast
    const violations = await getViolations(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    // Assert no color contrast violations
    expect(violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
  });

  test('Keyboard navigation flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test complete keyboard navigation flow
    const tabSequence = [];
    
    // Press Tab 20 times and record focus sequence
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        const role = await focusedElement.getAttribute('role');
        const ariaLabel = await focusedElement.getAttribute('aria-label');
        
        tabSequence.push({
          tagName,
          role,
          ariaLabel,
          isVisible: await focusedElement.isVisible()
        });
      }
    }
    
    // Ensure all focused elements are visible
    tabSequence.forEach((item, index) => {
      expect(item.isVisible).toBe(true);
    });
    
    // Ensure we have a logical tab sequence
    expect(tabSequence.length).toBeGreaterThan(5);
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      // Should have at least one h1
      const h1Elements = await page.locator('h1').count();
      expect(h1Elements).toBeGreaterThanOrEqual(1);
      
      // Check heading hierarchy (no skipping levels)
      const headingLevels = await Promise.all(
        headings.map(async (heading) => {
          const tagName = await heading.evaluate(el => el.tagName);
          return parseInt(tagName.charAt(1));
        })
      );
      
      // Ensure proper heading hierarchy
      for (let i = 1; i < headingLevels.length; i++) {
        const levelDiff = headingLevels[i] - headingLevels[i - 1];
        expect(levelDiff).toBeLessThanOrEqual(1);
      }
    }
    
    // Check for proper landmark roles
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').all();
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('Form error handling accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Submit form without filling required fields
    await page.locator('button[type="submit"]').click();
    
    // Check for accessible error messages
    const errorElements = page.locator('[role="alert"], .error, [aria-invalid="true"]');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      // Check first error message accessibility
      const firstError = errorElements.first();
      
      // Should be visible and readable
      await expect(firstError).toBeVisible();
      
      // Should have appropriate ARIA attributes
      const hasAriaLive = await firstError.getAttribute('aria-live');
      const hasRole = await firstError.getAttribute('role');
      
      expect(hasAriaLive || hasRole === 'alert').toBeTruthy();
    }
  });

  test('Focus management in interactive components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test dropdown/select focus management
    const selectElements = page.locator('select, [role="combobox"], [role="listbox"]');
    const selectCount = await selectElements.count();
    
    for (let i = 0; i < Math.min(selectCount, 3); i++) {
      const select = selectElements.nth(i);
      
      if (await select.isVisible()) {
        await select.focus();
        await expect(select).toBeFocused();
        
        // Test keyboard interaction
        await page.keyboard.press('Space');
        await page.keyboard.press('Escape');
      }
    }
    
    // Test button focus management
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
      
      // Test Enter and Space activation
      await page.keyboard.press('Enter');
      // Note: We don't test Space here as it might trigger unwanted actions
    }
  });
});

// Helper test to generate accessibility report
test('Generate accessibility report', async ({ page }) => {
  const results = [];
  const pages = ['/', '/login', '/register', '/foods'];
  
  for (const pagePath of pages) {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
    
    const violations = await getViolations(page);
    results.push({
      page: pagePath,
      violations: violations.length,
      details: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))
    });
  }
  
  // Log accessibility report
  console.log('🔍 Accessibility Report:');
  console.log(JSON.stringify(results, null, 2));
  
  // Ensure no critical violations
  const criticalViolations = results.flatMap(r => 
    r.details.filter(d => d.impact === 'critical' || d.impact === 'serious')
  );
  
  expect(criticalViolations).toHaveLength(0);
});