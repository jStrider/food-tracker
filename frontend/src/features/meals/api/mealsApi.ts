import { apiClient } from '@/utils/apiClient';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodEntries: any[]; // Will be properly typed when we implement food entries
}

export interface CreateMealRequest {
  name: string;
  category: MealType;
  date: string;
  userId?: string;
}

export interface UpdateMealRequest {
  name?: string;
  type?: MealType;
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