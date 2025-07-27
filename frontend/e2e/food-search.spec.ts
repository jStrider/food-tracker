import { test, expect } from './helpers/authenticated-test';

test.describe('Food Search', () => {
  test.beforeEach(async ({ page }) => {
    // Already authenticated via context
    // Navigate to food search page
    await page.goto('/foods');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('displays food search page', async ({ page }) => {
    await expect(page.getByText('Food Search')).toBeVisible();
    await expect(page.getByPlaceholder('Enter food name...')).toBeVisible();
    await expect(page.getByPlaceholder('Enter barcode...')).toBeVisible();
  });

  test('can search for foods by name', async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder('Enter food name...').fill('banana');
    
    // Wait for search results
    await page.waitForTimeout(1000); // Wait for debounce
    
    // Should show loading state
    await expect(page.getByText('Searching foods...')).toBeVisible();
    
    // Wait for results
    await page.waitForSelector('text=Search Results', { timeout: 10000 });
    
    // Should display results
    await expect(page.getByText('Search Results')).toBeVisible();
    
    // Results should contain food items with nutrition info
    await expect(page.getByText(/Calories:|Protein:|Carbs:|Fat:/)).toBeVisible();
  });

  test('shows message when no foods found', async ({ page }) => {
    // Search for something unlikely to exist
    await page.getByPlaceholder('Enter food name...').fill('xyzabc123notafood');
    
    // Wait for search
    await page.waitForTimeout(1000);
    
    // Should show no results message
    await expect(page.getByText(/No foods found/)).toBeVisible();
  });

  test('can search by barcode', async ({ page }) => {
    // Enter barcode
    await page.getByPlaceholder('Enter barcode...').fill('1234567890');
    
    // Wait for search
    await page.waitForTimeout(1000);
    
    // Should show loading state
    await expect(page.getByText('Scanning barcode...')).toBeVisible();
    
    // Wait for result or error
    await page.waitForSelector('text=Barcode Result, text=Failed to find food', { timeout: 10000 });
  });

  test('requires meal selection before adding food', async ({ page }) => {
    // Search for a food
    await page.getByPlaceholder('Enter food name...').fill('apple');
    await page.waitForTimeout(1000);
    
    // Try to add without selecting meal
    const addButton = page.locator('.rounded-lg').filter({ hasText: 'Apple' }).getByRole('button').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Should show error toast
      await expect(page.getByText('Error')).toBeVisible();
      await expect(page.getByText('Please select a meal first')).toBeVisible();
    }
  });

  test('can filter by date', async ({ page }) => {
    // Change date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.getByLabel('Date').fill(dateString);
    
    // Verify date changed
    await expect(page.getByLabel('Date')).toHaveValue(dateString);
  });

  test('displays meal selector', async ({ page }) => {
    // Check meal selector is present
    const mealSelector = page.getByRole('combobox');
    await expect(mealSelector).toBeVisible();
    
    // Click to open options
    await mealSelector.click();
    
    // Should show meal options or message if no meals
    await page.waitForSelector('text=Breakfast, text=No meals found', { timeout: 5000 });
  });
});