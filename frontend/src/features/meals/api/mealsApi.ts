import { apiClient } from '@/utils/apiClient';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  category: MealType; // Backend uses 'category' not 'type'
  date: string;
  time?: string; // HH:MM format
  isCustomCategory?: boolean;
  totalCalories: number; // Backend returns 'totalCalories' not 'calories'
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  foods?: any[]; // Backend returns 'foods' not 'foodEntries'
  // Custom macro values
  customCalories?: number;
  customProtein?: number;
  customCarbs?: number;
  customFat?: number;
}

export interface CreateMealRequest {
  name: string;
  category?: MealType; // Optional - will auto-categorize based on time if not provided
  date: string;
  time?: string; // HH:MM format
  userId?: string;
  // Custom macro overrides
  customCalories?: number;
  customProtein?: number;
  customCarbs?: number;
  customFat?: number;
}

export interface UpdateMealRequest {
  name?: string;
  category?: MealType;
  date?: string;
  time?: string; // HH:MM format
  // Custom macro overrides
  customCalories?: number;
  customProtein?: number;
  customCarbs?: number;
  customFat?: number;
}

export const mealsApi = {
  getMeals: async (date?: string): Promise<Meal[]> => {
    const response = await apiClient.get(`/meals${date ? `?date=${date}` : ''}`);
    return response.data;
  },

  getMeal: async (id: string): Promise<Meal> => {
    const response = await apiClient.get(`/meals/${id}`);
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