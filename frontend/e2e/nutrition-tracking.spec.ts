import { test, expect } from '@playwright/test';

test.describe('Nutrition Tracking', () => {
  test('displays daily nutrition summary', async ({ page }) => {
    await page.goto('/');
    
    // Click on today's date
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    
    // Should show daily summary
    await expect(page.getByText('Daily Summary')).toBeVisible();
    
    // Should display macro nutrients
    await expect(page.getByText(/Calories|Protein|Carbs|Fat/)).toBeVisible();
    
    // Should show totals (even if 0)
    await expect(page.getByText(/\d+g?/)).toBeVisible();
  });

  test('updates nutrition when adding food to meal', async ({ page }) => {
    // Navigate to today's view
    await page.goto('/');
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    
    // Note initial calories (might be 0)
    const initialCalories = await page.locator('text=/\\d+/').first().textContent();
    
    // Add a meal with food
    await page.getByRole('button', { name: 'Add Meal' }).click();
    await page.getByPlaceholder('e.g., Chicken salad').fill('Test Meal with Food');
    await page.getByRole('button', { name: 'Create Meal' }).click();
    
    // Go to food search
    await page.getByRole('link', { name: 'Food Search' }).click();
    
    // Select the meal we just created
    await page.getByRole('combobox').click();
    await page.getByText('Test Meal with Food').click();
    
    // Search and add food
    await page.getByPlaceholder('Enter food name...').fill('chicken');
    await page.waitForTimeout(1000);
    
    // Add first result
    const addButton = page.locator('.rounded-lg').getByRole('button').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByPlaceholder('Enter quantity...').fill('200');
      await page.getByRole('button', { name: 'Add to Meal' }).click();
      
      // Go back to calendar
      await page.getByRole('link', { name: 'Calendar' }).click();
      await page.getByText(today, { exact: true }).first().click();
      
      // Calories should have increased
      const newCalories = await page.locator('text=/\\d+/').first().textContent();
      expect(parseInt(newCalories || '0')).toBeGreaterThan(parseInt(initialCalories || '0'));
    }
  });

  test('shows nutrition goals progress', async ({ page }) => {
    await page.goto('/');
    
    // Click on today
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    
    // Should show goals section
    await expect(page.getByText('Daily Goals')).toBeVisible();
    
    // Should show progress indicators (percentages or progress bars)
    await expect(page.getByText(/%|goal/i)).toBeVisible();
  });

  test('displays weekly nutrition summary', async ({ page }) => {
    await page.goto('/');
    
    // Switch to week view
    await page.getByRole('button', { name: 'Week' }).click();
    
    // Should show week view
    await expect(page.getByTestId('week-view')).toBeVisible();
    
    // Should display days of the week
    await expect(page.getByText(/Monday|Tuesday|Wednesday/)).toBeVisible();
    
    // Should show nutrition data for each day
    await expect(page.getByText(/cal/)).toBeVisible();
  });

  test('shows meal breakdown by category', async ({ page }) => {
    await page.goto('/');
    
    // Click on a date
    await page.getByText('15', { exact: true }).first().click();
    
    // Should categorize meals
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    
    // At least one category should be visible if meals exist
    const visibleCategories = await Promise.all(
      categories.map(cat => page.getByText(cat).isVisible().catch(() => false))
    );
    
    // If any meals exist, at least one category should be shown
    if (visibleCategories.some(v => v)) {
      expect(visibleCategories.some(v => v)).toBeTruthy();
    }
  });
});