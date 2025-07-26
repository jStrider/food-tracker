// Core entity types
export interface User {
  id: string;
  email: string;
  name: string;
  timezone?: string;
  preferences?: {
    dailyCalorieGoal?: number;
    dailyProteinGoal?: number;
    dailyCarbGoal?: number;
    dailyFatGoal?: number;
    defaultMealCategories?: {
      breakfast: { startTime: string; endTime: string };
      lunch: { startTime: string; endTime: string };
      dinner: { startTime: string; endTime: string };
      snack: { startTime: string; endTime: string };
    };
  };
  meals: Meal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  openFoodFactsId?: string;
  openFoodFactsData?: any;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  servingSize: string;
  imageUrl?: string;
  ingredients?: string;
  allergens?: string[];
  categories?: string[];
  isCached: boolean;
  lastSyncedAt?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  date: Date;
  time?: string;
  isCustomCategory: boolean;
  userId: string;
  user: User;
  foods: FoodEntry[];
  createdAt: Date;
  updatedAt: Date;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
}

export interface FoodEntry {
  id: string;
  quantity: number;
  unit: string;
  mealId: string;
  foodId: string;
  meal: Meal;
  food: Food;
  createdAt: Date;
  updatedAt: Date;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
}

// Enums
export enum MealCategory {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum FoodSource {
  MANUAL = 'manual',
  OPENFOODFACTS = 'openfoodfacts',
  USDA = 'usda',
}

// Nutrition summary types
export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface MealSummary extends NutritionSummary {
  id: string;
  name: string;
  category: string;
}

export interface DailyNutrition extends NutritionSummary {
  id: string;
  date: Date;
  userId: string;
  user: User;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  totalSaturatedFat: number;
  totalTransFat: number;
  totalCholesterol: number;
  totalPotassium: number;
  totalVitaminA: number;
  totalVitaminC: number;
  totalCalcium: number;
  totalIron: number;
  calorieGoal?: number;
  proteinGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
  mealCount: number;
  waterIntake: number;
  waterGoal: number;
  exerciseCaloriesBurned: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  calorieProgress: number;
  proteinProgress: number;
  carbProgress: number;
  fatProgress: number;
  waterProgress: number;
  netCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
  nutritionScore: number;
  goalsMetStatus: {
    calories: boolean;
    protein: boolean;
    carbs: boolean;
    fat: boolean;
    water: boolean;
  };
}

export interface DailyNutritionSummary {
  date: string;
  meals: MealSummary[];
}

// Calendar types
export interface CalendarDay {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
  hasData: boolean;
}

export interface MonthData {
  month: number;
  year: number;
  days: CalendarDay[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search and filter types
export interface FoodSearchParams {
  query?: string;
  barcode?: string;
  page?: number;
  limit?: number;
}

export interface MealFilterParams {
  date?: string;
  category?: MealCategory;
  startDate?: string;
  endDate?: string;
}