import { test, expect } from '@playwright/test';

test.describe('Meal Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can create a new meal', async ({ page }) => {
    // Click on today's date in the calendar
    const today = new Date().getDate().toString();
    await page.getByText(today, { exact: true }).first().click();
    
    // Click add meal button
    await page.getByRole('button', { name: 'Add Meal' }).click();
    
    // Fill in meal form
    await page.getByPlaceholder('e.g., Chicken salad').fill('Test Breakfast');
    
    // Select meal type (breakfast should be default)
    const typeSelect = page.getByRole('combobox');
    await expect(typeSelect).toHaveText('Breakfast');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Meal' }).click();
    
    // Verify meal was created
    await expect(page.getByText('Success')).toBeVisible();
    await expect(page.getByText('Test Breakfast')).toBeVisible();
  });

  test('can add food to meal', async ({ page }) => {
    // Navigate to food search
    await page.getByRole('link', { name: 'Food Search' }).click();
    
    // Wait for meals to load
    await page.waitForLoadState('networkidle');
    
    // Select a meal
    await page.getByRole('combobox').click();
    await page.getByText(/Breakfast|Lunch|Dinner/).first().click();
    
    // Search for food
    await page.getByPlaceholder('Enter food name...').fill('apple');
    
    // Wait for search results
    await page.waitForTimeout(1000); // Wait for debounce
    
    // Click add button on first result
    await page.locator('.rounded-lg').filter({ hasText: 'Apple' }).getByRole('button').first().click();
    
    // Fill quantity in modal
    await page.getByPlaceholder('Enter quantity...').fill('150');
    
    // Add food to meal
    await page.getByRole('button', { name: 'Add to Meal' }).click();
    
    // Verify success
    await expect(page.getByText('Success')).toBeVisible();
  });

  test('can view meal details', async ({ page }) => {
    // Click on a date with meals
    await page.getByText('15', { exact: true }).first().click();
    
    // If meals exist, they should be visible
    const mealCards = page.locator('[data-testid^="meal-"]');
    const count = await mealCards.count();
    
    if (count > 0) {
      // Click on first meal to expand
      await mealCards.first().click();
      
      // Should show meal details
      await expect(page.getByText(/cal|Protein|Carbs|Fat/)).toBeVisible();
    }
  });

  test('can delete a meal', async ({ page }) => {
    // Create a meal first
    await page.getByText(new Date().getDate().toString(), { exact: true }).first().click();
    await page.getByRole('button', { name: 'Add Meal' }).click();
    await page.getByPlaceholder('e.g., Chicken salad').fill('Meal to Delete');
    await page.getByRole('button', { name: 'Create Meal' }).click();
    
    // Wait for meal to be created
    await expect(page.getByText('Meal to Delete')).toBeVisible();
    
    // Delete the meal
    const mealCard = page.locator('text=Meal to Delete').locator('..');
    await mealCard.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify meal was deleted
    await expect(page.getByText('Meal to Delete')).not.toBeVisible();
  });
});