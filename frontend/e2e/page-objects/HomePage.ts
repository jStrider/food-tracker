import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object Model
 * Handles calendar navigation, meal management, and nutrition summary
 */
export class HomePage extends BasePage {
  protected url = '/';

  // Selectors
  private calendarContainer = '[data-testid="calendar-container"], .calendar-container';
  private dayViewButton = 'button:has-text("Day")';
  private weekViewButton = 'button:has-text("Week")';
  private monthViewButton = 'button:has-text("Month")';
  private addMealButton = 'button:has-text("Add Meal")';
  private nutritionSummary = '[data-testid="nutrition-summary"], .nutrition-summary, .daily-summary';
  private mealCard = '[data-testid^="meal-"], .meal-card';

  constructor(page: Page) {
    super(page);
  }

  // Calendar Navigation
  async switchToMonthView(): Promise<void> {
    await this.safeClick(this.monthViewButton);
    await this.waitForViewTransition();
  }

  async switchToWeekView(): Promise<void> {
    await this.safeClick(this.weekViewButton);
    await this.waitForViewTransition();
  }

  async switchToDayView(): Promise<void> {
    await this.safeClick(this.dayViewButton);
    await this.waitForViewTransition();
  }

  private async waitForViewTransition(): Promise<void> {
    await this.page.waitForTimeout(500); // Wait for view transition
    await this.waitForNetworkIdle();
  }

  // Date Selection
  async selectDate(day: number): Promise<void> {
    const daySelector = `text="${day}"`;
    await this.safeClick(daySelector);
    await this.waitForNetworkIdle();
  }

  async selectToday(): Promise<void> {
    const today = new Date().getDate();
    await this.selectDate(today);
  }

  async getCurrentSelectedDate(): Promise<string> {
    // This would depend on the specific implementation
    const selectedDate = this.page.locator('.selected-date, [aria-selected="true"]');
    return await selectedDate.textContent() || '';
  }

  // Meal Management
  async openAddMealModal(): Promise<void> {
    await this.safeClick(this.addMealButton);
    await this.waitForElement('[role="dialog"]');
  }

  async getMealCards(): Promise<Locator> {
    return this.page.locator(this.mealCard);
  }

  async getMealCount(): Promise<number> {
    return await this.countElements(this.mealCard);
  }

  async clickMealCard(index: number = 0): Promise<void> {
    const mealCards = await this.getMealCards();
    await mealCards.nth(index).click();
  }

  async deleteMeal(mealName: string): Promise<void> {
    const mealElement = this.page.locator(`text="${mealName}"`).locator('..');
    const deleteButton = mealElement.locator('button:has-text("Delete")');
    await deleteButton.click();
    
    // Confirm deletion
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    await confirmButton.click();
    
    await this.waitForNetworkIdle();
  }

  // Nutrition Summary
  async getNutritionSummary(): Promise<Locator> {
    return this.page.locator(this.nutritionSummary);
  }

  async isNutritionSummaryVisible(): Promise<boolean> {
    return await this.isElementVisible(this.nutritionSummary);
  }

  async getNutritionValue(nutrient: 'calories' | 'protein' | 'carbs' | 'fat'): Promise<string> {
    const nutrientSelector = `[data-testid="${nutrient}"], text=/${nutrient}/i`;
    const element = this.page.locator(nutrientSelector).first();
    return await element.textContent() || '0';
  }

  async getDailyGoalProgress(nutrient: 'calories' | 'protein' | 'carbs' | 'fat'): Promise<number> {
    const progressSelector = `[data-testid="${nutrient}-progress"], [aria-label*="${nutrient}"]`;
    const progressElement = this.page.locator(progressSelector);
    
    if (await progressElement.count() > 0) {
      const ariaValueNow = await progressElement.getAttribute('aria-valuenow');
      return ariaValueNow ? parseInt(ariaValueNow) : 0;
    }
    
    return 0;
  }

  // Calendar Keyboard Navigation
  async navigateCalendarWithKeyboard(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const calendarGrid = this.page.locator('[role="grid"]').first();
    
    if (await calendarGrid.isVisible()) {
      await calendarGrid.focus();
      
      const keyMap = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
      };
      
      await this.page.keyboard.press(keyMap[direction]);
    }
  }

  // View State Validation
  async getCurrentView(): Promise<'day' | 'week' | 'month'> {
    const activeButton = this.page.locator('button[aria-pressed="true"], button.active');
    const buttonText = await activeButton.textContent();
    
    if (buttonText?.toLowerCase().includes('day')) return 'day';
    if (buttonText?.toLowerCase().includes('week')) return 'week';
    if (buttonText?.toLowerCase().includes('month')) return 'month';
    
    return 'month'; // default
  }

  async isCalendarVisible(): Promise<boolean> {
    return await this.isElementVisible(this.calendarContainer);
  }

  // Accessibility Helpers
  async checkCalendarAccessibility(): Promise<void> {
    // Check for proper ARIA attributes on calendar
    await this.assertElementHasAttribute(
      '[role="grid"]',
      'aria-label',
      /calendar|grid/i,
      'Calendar should have proper aria-label'
    );
    
    // Check navigation buttons have proper labels
    const navButtons = this.page.locator(
      `${this.dayViewButton}, ${this.weekViewButton}, ${this.monthViewButton}`
    );
    
    const buttonCount = await navButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = navButtons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      if (!hasAriaLabel && !hasText) {
        throw new Error(`Navigation button ${i} missing accessible label`);
      }
    }
  }

  // Performance Helpers
  async measureCalendarViewSwitch(): Promise<number> {
    const startTime = Date.now();
    await this.switchToWeekView();
    const endTime = Date.now();
    return endTime - startTime;
  }

  // Date Utilities
  async navigateToDate(date: Date): Promise<void> {
    // This would depend on the specific calendar implementation
    // For now, just select the day if it's in the current month
    const day = date.getDate();
    await this.selectDate(day);
  }

  async getCurrentMonth(): Promise<string> {
    const monthElement = this.page.locator('[data-testid="current-month"], .current-month');
    return await monthElement.textContent() || '';
  }

  async navigateToNextMonth(): Promise<void> {
    const nextButton = this.page.locator('button:has-text("Next"), [aria-label*="next"]');
    await nextButton.click();
    await this.waitForNetworkIdle();
  }

  async navigateToPreviousMonth(): Promise<void> {
    const prevButton = this.page.locator('button:has-text("Previous"), [aria-label*="previous"]');
    await prevButton.click();
    await this.waitForNetworkIdle();
  }
}