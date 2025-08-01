import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Meal Modal Page Object Model
 * Handles meal creation and editing modals
 */
export class MealModal extends BasePage {
  // Modal selectors
  private modal = '[role="dialog"]';
  private mealNameInput = 'input[placeholder*="Chicken salad"], input[name="name"], #meal-name';
  private mealTypeSelect = '[role="combobox"], select[name="type"], #meal-type';
  private createButton = 'button:has-text("Create Meal")';
  private updateButton = 'button:has-text("Update Meal")';
  private cancelButton = 'button:has-text("Cancel")';
  private closeButton = 'button:has-text("×"), button[aria-label="Close"]';

  constructor(page: Page) {
    super(page);
  }

  // Modal State
  async isVisible(): Promise<boolean> {
    return await this.isElementVisible(this.modal);
  }

  async waitForModal(): Promise<void> {
    await this.waitForElement(this.modal);
  }

  // Form Interactions
  async fillMealName(name: string): Promise<void> {
    await this.waitForModal();
    await this.safeFill(this.mealNameInput, name);
  }

  async selectMealType(type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): Promise<void> {
    await this.waitForModal();
    
    const selectElement = this.page.locator(this.mealTypeSelect);
    
    // Handle different types of select elements
    if (await selectElement.getAttribute('role') === 'combobox') {
      // Custom dropdown component
      await selectElement.click();
      await this.page.locator(`text="${type}"`).click();
    } else {
      // Native select element
      await selectElement.selectOption(type);
    }
  }

  async getCurrentMealType(): Promise<string> {
    const selectElement = this.page.locator(this.mealTypeSelect);
    
    if (await selectElement.getAttribute('role') === 'combobox') {
      return await selectElement.textContent() || '';
    } else {
      return await selectElement.inputValue();
    }
  }

  // Modal Actions
  async createMeal(name: string, type?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): Promise<void> {
    await this.fillMealName(name);
    
    if (type) {
      await this.selectMealType(type);
    }
    
    await this.safeClick(this.createButton);
    await this.waitForModalClose();
  }

  async updateMeal(name?: string, type?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): Promise<void> {
    if (name) {
      await this.fillMealName(name);
    }
    
    if (type) {
      await this.selectMealType(type);
    }
    
    await this.safeClick(this.updateButton);
    await this.waitForModalClose();
  }

  async cancelMeal(): Promise<void> {
    await this.safeClick(this.cancelButton);
    await this.waitForModalClose();
  }

  async closeMeal(): Promise<void> {
    // Try clicking close button first
    const closeBtn = this.page.locator(this.closeButton);
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
    } else {
      // Fall back to Escape key
      await this.page.keyboard.press('Escape');
    }
    
    await this.waitForModalClose();
  }

  private async waitForModalClose(): Promise<void> {
    const modal = this.page.locator(this.modal);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  // Validation
  async getValidationErrors(): Promise<string[]> {
    const errorElements = this.page.locator(`${this.modal} .error, ${this.modal} [role="alert"]`);
    const errors: string[] = [];
    
    const count = await errorElements.count();
    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText);
      }
    }
    
    return errors;
  }

  async hasValidationError(): Promise<boolean> {
    const errors = await this.getValidationErrors();
    return errors.length > 0;
  }

  // Form State
  async isCreateMode(): Promise<boolean> {
    return await this.isElementVisible(this.createButton);
  }

  async isEditMode(): Promise<boolean> {
    return await this.isElementVisible(this.updateButton);
  }

  async getMealNameValue(): Promise<string> {
    const input = this.page.locator(this.mealNameInput);
    return await input.inputValue();
  }

  // Accessibility Helpers
  async checkModalAccessibility(): Promise<void> {
    await this.waitForModal();
    
    // Check modal has proper role
    await this.assertElementHasAttribute(
      this.modal,
      'role',
      'dialog',
      'Modal should have role="dialog"'
    );
    
    // Check modal has aria-label or aria-labelledby
    const modal = this.page.locator(this.modal);
    const hasAriaLabel = await modal.getAttribute('aria-label');
    const hasAriaLabelledBy = await modal.getAttribute('aria-labelledby');
    
    if (!hasAriaLabel && !hasAriaLabelledBy) {
      throw new Error('Modal should have aria-label or aria-labelledby');
    }
    
    // Check focus management
    const focusedElement = this.page.locator(':focus');
    const isFocusInModal = await modal.locator(':focus').count() > 0;
    
    if (!isFocusInModal) {
      throw new Error('Focus should be trapped within modal');
    }
    
    // Check form labels
    const nameInput = this.page.locator(this.mealNameInput);
    const hasLabel = await nameInput.getAttribute('aria-label') || 
                    await this.page.locator(`label[for="${await nameInput.getAttribute('id')}"]`).count() > 0;
    
    if (!hasLabel) {
      throw new Error('Meal name input should have proper labeling');
    }
  }

  // Keyboard Navigation
  async navigateWithTab(): Promise<string[]> {
    await this.waitForModal();
    
    const focusSequence: string[] = [];
    const maxTabs = 10; // Prevent infinite loop
    
    for (let i = 0; i < maxTabs; i++) {
      await this.page.keyboard.press('Tab');
      
      const focusedElement = this.page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        const type = await focusedElement.getAttribute('type');
        const role = await focusedElement.getAttribute('role');
        
        focusSequence.push(`${tagName}${type ? `[type="${type}"]` : ''}${role ? `[role="${role}"]` : ''}`);
        
        // If we've cycled back to the first element, break
        if (i > 0 && await focusedElement.evaluate(el => 
          el === document.querySelector('input[placeholder*="Chicken salad"], input[name="name"], #meal-name')
        )) {
          break;
        }
      }
    }
    
    return focusSequence;
  }

  async testEscapeKeyCloses(): Promise<boolean> {
    await this.waitForModal();
    await this.page.keyboard.press('Escape');
    
    try {
      await this.waitForModalClose();
      return true;
    } catch {
      return false;
    }
  }

  // Performance Testing
  async measureModalOpenTime(): Promise<number> {
    // This would be called before opening the modal
    const startTime = Date.now();
    await this.waitForModal();
    const endTime = Date.now();
    return endTime - startTime;
  }

  // Form Validation Testing
  async testRequiredFieldValidation(): Promise<boolean> {
    await this.waitForModal();
    
    // Try to submit with empty name
    await this.safeClick(this.createButton);
    
    // Check if validation error appears
    await this.page.waitForTimeout(500); // Give time for validation
    return await this.hasValidationError();
  }

  async testMealTypeDefaultValue(): Promise<string> {
    await this.waitForModal();
    return await this.getCurrentMealType();
  }
}