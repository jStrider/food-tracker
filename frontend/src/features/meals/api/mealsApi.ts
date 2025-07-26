import { apiClient } from '@/utils/apiClient';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  imageUrl?: string;
}

export interface FoodEntry {
  id: string;
  quantity: number;
  unit: string;
  food: Food;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
}

export interface Meal {
  id: string;
  name: string;
  category: MealType;
  date: string;
  time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  foodEntries: FoodEntry[];
}

export interface CreateMealRequest {
  name: string;
  category: MealType;
  date: string;
  userId?: string;
}

export interface UpdateMealRequest {
  name?: string;
  category?: MealType;
  date?: string;
  time?: string;
}

export const mealsApi = {
  getMeals: async (date?: string): Promise<Meal[]> => {
    const response = await apiClient.get(`/meals${date ? `?date=${date}` : ''}`);
    return response.data;
  },

  getMeal: async (id: string, includeFoods: boolean = true): Promise<Meal> => {
    const response = await apiClient.get(`/meals/${id}?includeFoods=${includeFoods}`);
    return response.data;
  },

  createMeal: async (meal: CreateMealRequest): Promise<Meal> => {
    const response = await apiClient.post('/meals', meal);
    return response.data;
  },

  updateMeal: async (id: string, meal: UpdateMealRequest): Promise<Meal> => {
    const response = await apiClient.put(`/meals/${id}`, meal);
    return response.data;
  },

  deleteMeal: async (id: string): Promise<void> => {
    await apiClient.delete(`/meals/${id}`);
  },
};