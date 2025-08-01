import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model
 * Provides common functionality and patterns for all page objects
 */
export abstract class BasePage {
  protected page: Page;
  protected url: string = '';

  // Common selectors
  protected loadingSelector = '.loading, .spinner, [data-testid="loading"]';
  protected errorSelector = '.error, [role="alert"], [data-testid="error"]';
  protected successSelector = '.success, [data-testid="success"]';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page
   */
  async goto(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) {
    await this.page.goto(this.url, { 
      waitUntil: options?.waitUntil || 'networkidle' 
    });
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    
    // Wait for loading indicators to disappear
    const loadingElements = this.page.locator(this.loadingSelector);
    if (await loadingElements.count() > 0) {
      await loadingElements.first().waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * Check if page has loaded successfully
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForPageLoad();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Check for error messages
   */
  async hasError(): Promise<boolean> {
    const errorElements = this.page.locator(this.errorSelector);
    return await errorElements.count() > 0;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator(this.errorSelector).first();
    return await errorElement.textContent() || '';
  }

  /**
   * Check for success messages
   */
  async hasSuccess(): Promise<boolean> {
    const successElements = this.page.locator(this.successSelector);
    return await successElements.count() > 0;
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    const successElement = this.page.locator(this.successSelector).first();
    return await successElement.textContent() || '';
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Safe click with wait
   */
  async safeClick(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.click();
  }

  /**
   * Safe fill with wait
   */
  async safeFill(selector: string, value: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.fill(value);
  }

  /**
   * Take screenshot of specific element
   */
  async screenshotElement(selector: string, filename: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.screenshot({ path: filename });
  }

  /**
   * Take full page screenshot
   */
  async screenshotPage(filename: string): Promise<void> {
    await this.page.screenshot({ path: filename, fullPage: true });
  }

  /**
   * Wait for network requests to complete
   */
  async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Check element visibility
   */
  async isElementVisible(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isVisible();
  }

  /**
   * Get element text content
   */
  async getElementText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return await element.textContent() || '';
  }

  /**
   * Get element attribute
   */
  async getElementAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * Count elements matching selector
   */
  async countElements(selector: string): Promise<number> {
    const elements = this.page.locator(selector);
    return await elements.count();
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(urlPattern: string | RegExp, timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Check accessibility of current page
   */
  async checkAccessibility(): Promise<void> {
    // This would integrate with axe-playwright
    // Implementation depends on the specific accessibility testing setup
  }

  /**
   * Simulate keyboard navigation
   */
  async navigateWithKeyboard(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
      await this.page.waitForTimeout(100); // Small delay between key presses
    }
  }

  /**
   * Close any open modals or overlays
   */
  async closeModals(): Promise<void> {
    const modals = this.page.locator('[role="dialog"], .modal, .overlay');
    const modalCount = await modals.count();
    
    for (let i = 0; i < modalCount; i++) {
      const modal = modals.nth(i);
      if (await modal.isVisible()) {
        // Try clicking close button first
        const closeButton = modal.locator('button:has-text("Close"), button:has-text("×"), [aria-label="Close"]');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
        } else {
          // Try pressing Escape
          await this.page.keyboard.press('Escape');
        }
        await modal.waitFor({ state: 'hidden', timeout: 5000 });
      }
    }
  }

  /**
   * Assert element is visible with custom message
   */
  async assertElementVisible(selector: string, message?: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element, message).toBeVisible();
  }

  /**
   * Assert element has text
   */
  async assertElementHasText(selector: string, expectedText: string | RegExp, message?: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element, message).toHaveText(expectedText);
  }

  /**
   * Assert element has attribute with value
   */
  async assertElementHasAttribute(selector: string, attribute: string, value: string | RegExp, message?: string): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element, message).toHaveAttribute(attribute, value);
  }
}