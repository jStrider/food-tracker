import { apiClient } from '@/utils/apiClient';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  date: string;
  time?: string; // HH:MM format
  isCustomCategory: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodEntries: any[]; // Will be properly typed when we implement food entries
}

export interface CreateMealRequest {
  name: string;
  type?: MealType; // Optional - will auto-categorize based on time if not provided
  date: string;
  time?: string; // HH:MM format
}

export interface UpdateMealRequest {
  name?: string;
  type?: MealType;
  date?: string;
  time?: string; // HH:MM format
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