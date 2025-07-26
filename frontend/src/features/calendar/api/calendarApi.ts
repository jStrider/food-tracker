import { apiClient } from '@/utils/apiClient';

export interface CalendarDay {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
  hasData: boolean;
  meals?: {
    id: string;
    name: string;
    category: string;
    time?: string;
    calories: number;
  }[];
}

export interface MonthData {
  month: number;
  year: number;
  days: CalendarDay[];
  summary?: {
    totalDays: number;
    daysWithData: number;
    averageCalories: number;
    totalCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    totalMeals?: number;
    avgDailyCalories?: number;
  };
}

export const calendarApi = {
  getMonthView: async (month: number, year: number): Promise<MonthData> => {
    const response = await apiClient.get(`/calendar/month?month=${month}&year=${year}`);
    return response.data;
  },

  getWeekView: async (startDate: string) => {
    const response = await apiClient.get(`/calendar/week?startDate=${startDate}`);
    return response.data;
  },

  getDayView: async (date: string) => {
    const response = await apiClient.get(`/calendar/day?date=${date}`);
    return response.data;
  },
};