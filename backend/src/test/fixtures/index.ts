// Test fixtures for consistent test data across all tests
// SECURITY FIX: Removed hardcoded user IDs, now using dynamic generation
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates test fixtures with dynamic user IDs for security
 * @param userId - The user ID to use for user-related data (generated if not provided)
 */
export const createTestFixtures = (userId?: string) => {
  const testUserId = userId || uuidv4();
  const secondaryUserId = uuidv4();

  return {
    users: {
      john: {
        id: testUserId,
        username: "johndoe",
        email: "john@example.com",
        name: "John Doe",
        password: "$2b$12$hashedpassword",
      },
      jane: {
        id: secondaryUserId,
        username: "janedoe",
        email: "jane@example.com",
        name: "Jane Doe",
        password: "$2b$12$hashedpassword",
      },
    },

    meals: {
      breakfast: {
        id: "1",
        userId: testUserId, // Dynamic user ID
        category: "breakfast",
        date: "2024-01-15",
        time: "08:00",
        notes: "Healthy breakfast",
      },
      lunch: {
        id: "2",
        userId: testUserId, // Dynamic user ID
        category: "lunch",
        date: "2024-01-15",
        time: "12:30",
        notes: "Light lunch",
      },
      dinner: {
        id: "3",
        userId: testUserId, // Dynamic user ID
        category: "dinner",
        date: "2024-01-15",
        time: "19:00",
        notes: "Family dinner",
      },
      snack: {
        id: "4",
        userId: testUserId, // Dynamic user ID
        category: "snack",
        date: "2024-01-15",
        time: "15:00",
        notes: "Afternoon snack",
      },
    },

  foods: {
    apple: {
      id: "1",
      name: "Apple",
      barcode: "1111111111",
      source: "manual",
      brand: "Generic",
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10.4,
      sodium: 1,
      servingSize: "100",
      servingUnit: "g",
    },
    chickenBreast: {
      id: "2",
      name: "Chicken Breast",
      barcode: "2222222222",
      source: "manual",
      brand: "Generic",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      servingSize: "100",
      servingUnit: "g",
    },
    brownRice: {
      id: "3",
      name: "Brown Rice",
      barcode: "3333333333",
      source: "manual",
      brand: "Generic",
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      sugar: 0.4,
      sodium: 5,
      servingSize: "100",
      servingUnit: "g",
    },
    yogurt: {
      id: "4",
      name: "Greek Yogurt",
      barcode: "4444444444",
      source: "openfoodfacts",
      brand: "Chobani",
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      sugar: 3.2,
      sodium: 36,
      servingSize: "100",
      servingUnit: "g",
    },
  },

  foodEntries: {
    breakfastApple: {
      id: "1",
      mealId: "1",
      foodId: "1",
      quantity: 1.5,
      unit: "serving",
      calories: 78,
      protein: 0.45,
      carbs: 21,
      fat: 0.3,
    },
    lunchChicken: {
      id: "2",
      mealId: "2",
      foodId: "2",
      quantity: 200,
      unit: "g",
      calories: 330,
      protein: 62,
      carbs: 0,
      fat: 7.2,
    },
    lunchRice: {
      id: "3",
      mealId: "2",
      foodId: "3",
      quantity: 150,
      unit: "g",
      calories: 166.5,
      protein: 3.9,
      carbs: 34.5,
      fat: 1.35,
    },
  },

    nutritionGoals: {
      standard: {
        userId: testUserId, // Dynamic user ID
        dailyCalories: 2000,
        dailyProtein: 50,
        dailyCarbs: 250,
        dailyFat: 65,
        dailyFiber: 25,
        dailySugar: 50,
        dailySodium: 2300,
      },
      athletic: {
        userId: secondaryUserId, // Dynamic user ID
        dailyCalories: 2500,
        dailyProtein: 100,
        dailyCarbs: 300,
        dailyFat: 80,
        dailyFiber: 30,
        dailySugar: 40,
        dailySodium: 2500,
      },
    },

    openFoodFactsResponses: {
    found: {
      status: 1,
      product: {
        code: "3017620422003",
        product_name: "Nutella",
        brands: "Ferrero",
        nutriments: {
          "energy-kcal_100g": 539,
          proteins_100g: 6.3,
          carbohydrates_100g: 57.5,
          fat_100g: 30.9,
          fiber_100g: 3.5,
          sugars_100g: 56.3,
          sodium_100g: 0.107,
        },
        serving_size: "15g",
      },
    },
    notFound: {
      status: 0,
      status_verbose: "product not found",
      },
    },
  };
};

// Backwards compatibility - deprecated
// @deprecated Use createTestFixtures() with dynamic user IDs instead
export const fixtures = createTestFixtures();
