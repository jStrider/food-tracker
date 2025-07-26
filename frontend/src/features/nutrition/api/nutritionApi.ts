import { apiClient } from '@/utils/apiClient';

export interface MealSummary {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  meals: MealSummary[];
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface GoalComparison {
  actual: DailyNutrition;
  goals: NutritionGoals;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
}

export const nutritionApi = {
  getDailyNutrition: async (date: string): Promise<DailyNutrition> => {
    const response = await apiClient.get(`/nutrition/daily?date=${date}`);
    return response.data;
  },

  getWeeklyNutrition: async (startDate: string): Promise<DailyNutrition[]> => {
    const response = await apiClient.get(`/nutrition/weekly?startDate=${startDate}`);
    return response.data;
  },

  getMonthlyNutrition: async (month: number, year: number): Promise<DailyNutrition[]> => {
    const response = await apiClient.get(`/nutrition/monthly?month=${month}&year=${year}`);
    return response.data;
  },

  compareToGoals: async (date: string, goals: NutritionGoals): Promise<GoalComparison> => {
    const response = await apiClient.post(`/nutrition/goals/compare?date=${date}`, goals);
    return response.data;
  },

  getMacroBreakdown: async (date: string): Promise<{ calories: number; protein: number; carbs: number; fat: number }> => {
    const response = await apiClient.get(`/nutrition/macro-breakdown?date=${date}`);
    return response.data;
  },
};