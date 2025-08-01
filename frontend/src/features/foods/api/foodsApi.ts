import { apiClient } from '@/utils/apiClient';

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

export const foodsApi = {
  searchFoods: async (query: string): Promise<Food[]> => {
    const response = await apiClient.get(`/foods/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  searchFoodsAutocomplete: async (query: string, limit: number = 8): Promise<Food[]> => {
    const response = await apiClient.get(`/foods/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  searchByBarcode: async (barcode: string): Promise<Food> => {
    const response = await apiClient.get(`/foods/search?barcode=${barcode}`);
    return response.data;
  },

  getAllFoods: async (): Promise<Food[]> => {
    const response = await apiClient.get('/foods');
    return response.data;
  },

  getFood: async (id: string): Promise<Food> => {
    const response = await apiClient.get(`/foods/${id}`);
    return response.data;
  },

  createFood: async (food: Omit<Food, 'id'>): Promise<Food> => {
    const response = await apiClient.post('/foods', food);
    return response.data;
  },

  updateFood: async (id: string, food: Partial<Food>): Promise<Food> => {
    const response = await apiClient.put(`/foods/${id}`, food);
    return response.data;
  },

  deleteFood: async (id: string): Promise<void> => {
    await apiClient.delete(`/foods/${id}`);
  },

  addFoodToMeal: async (mealId: string, foodEntry: { foodId: string; quantity: number; unit?: string }): Promise<FoodEntry> => {
    const response = await apiClient.post(`/foods/${mealId}/entries`, foodEntry);
    return response.data;
  },

  updateFoodEntry: async (entryId: string, foodEntry: Partial<FoodEntry>): Promise<FoodEntry> => {
    const response = await apiClient.put(`/foods/entries/${entryId}`, foodEntry);
    return response.data;
  },

  removeFoodEntry: async (entryId: string): Promise<void> => {
    await apiClient.delete(`/foods/entries/${entryId}`);
  },
};