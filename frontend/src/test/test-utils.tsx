import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Create a custom render function that includes all providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const createMockMeal = (overrides = {}) => ({
  id: '1',
  name: 'Test Meal',
  category: 'lunch',
  date: '2024-01-15',
  time: '12:30',
  notes: '',
  foods: [],
  ...overrides,
});

export const createMockFood = (overrides = {}) => ({
  id: '1',
  name: 'Apple',
  barcode: '1234567890',
  brand: 'Generic',
  calories: 52,
  protein: 0.3,
  carbs: 14,
  fat: 0.2,
  fiber: 2.4,
  sugar: 10.4,
  sodium: 1,
  servingSize: '100',
  servingUnit: 'g',
  source: 'manual',
  ...overrides,
});

export const createMockFoodEntry = (overrides = {}) => ({
  id: '1',
  foodId: '1',
  mealId: '1',
  quantity: 1,
  unit: 'serving',
  calculatedCalories: 52,
  calculatedProtein: 0.3,
  calculatedCarbs: 14,
  calculatedFat: 0.2,
  food: createMockFood(),
  ...overrides,
});

export const createMockDailyNutrition = (overrides = {}) => ({
  date: '2024-01-15',
  mealCount: 3,
  calories: 1800,
  protein: 90,
  carbs: 225,
  fat: 60,
  fiber: 25,
  sugar: 50,
  sodium: 2000,
  meals: [],
  ...overrides,
});