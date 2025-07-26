import { DataSource } from 'typeorm';
import { User } from '../features/users/entities/user.entity';
import { Meal } from '../features/meals/entities/meal.entity';
import { Food } from '../features/foods/entities/food.entity';
import { FoodEntry } from '../features/foods/entities/food-entry.entity';
import { DailyNutrition } from '../features/nutrition/entities/daily-nutrition.entity';

// Create an in-memory SQLite database for testing
export const createTestDataSource = (): DataSource => {
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: [User, Meal, Food, FoodEntry, DailyNutrition],
  });
};

// Helper to clean up database after tests
export const cleanupDatabase = async (dataSource: DataSource) => {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
};

// Test data factories
export const createTestUser = () => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createTestMeal = (userId: number = 1, overrides = {}) => ({
  userId,
  category: 'lunch',
  date: new Date().toISOString().split('T')[0],
  time: '12:00',
  notes: 'Test meal',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestFood = (overrides = {}) => ({
  name: 'Test Food',
  barcode: '1234567890',
  source: 'manual',
  calories: 100,
  protein: 10,
  carbs: 20,
  fat: 5,
  fiber: 2,
  sugar: 8,
  sodium: 150,
  servingSize: 100,
  servingUnit: 'g',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestFoodEntry = (mealId: number, foodId: number, overrides = {}) => ({
  mealId,
  foodId,
  quantity: 1,
  unit: 'serving',
  calories: 100,
  protein: 10,
  carbs: 20,
  fat: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock external services
export const mockOpenFoodFactsResponse = (barcode: string) => ({
  status: 1,
  product: {
    code: barcode,
    product_name: 'Mock Product',
    nutriments: {
      'energy-kcal_100g': 250,
      proteins_100g: 8,
      carbohydrates_100g: 45,
      fat_100g: 6,
      fiber_100g: 3,
      sugars_100g: 12,
      sodium_100g: 0.5,
    },
    serving_size: '50g',
  },
});

// Common test utilities
export const expectToBeWithinRange = (actual: number, expected: number, tolerance: number = 0.01) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};