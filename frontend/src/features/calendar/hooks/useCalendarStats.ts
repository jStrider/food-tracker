import { useMemo } from 'react';

interface MealData {
  id: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

interface DayData {
  date: string;
  meals: MealData[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

interface CalendarStats {
  totalCalories: number;
  totalMeals: number;
  averageCaloriesPerDay: number;
  daysWithData: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  averageProteinPerDay: number;
  averageCarbsPerDay: number;
  averageFatPerDay: number;
  mealDistribution: Record<string, number>;
}

/**
 * Hook to calculate statistics from calendar data
 */
export function useCalendarStats(data: DayData[] | undefined): CalendarStats | null {
  return useMemo(() => {
    if (!data || data.length === 0) return null;

    const stats: CalendarStats = {
      totalCalories: 0,
      totalMeals: 0,
      averageCaloriesPerDay: 0,
      daysWithData: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      averageProteinPerDay: 0,
      averageCarbsPerDay: 0,
      averageFatPerDay: 0,
      mealDistribution: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0,
      },
    };

    data.forEach(day => {
      if (day.meals && day.meals.length > 0) {
        stats.daysWithData++;
        stats.totalCalories += day.totalCalories || 0;
        stats.totalProtein += day.totalProtein || 0;
        stats.totalCarbs += day.totalCarbs || 0;
        stats.totalFat += day.totalFat || 0;
        stats.totalMeals += day.mealCount || 0;

        day.meals.forEach(meal => {
          if (meal.category && stats.mealDistribution[meal.category] !== undefined) {
            stats.mealDistribution[meal.category]++;
          }
        });
      }
    });

    if (stats.daysWithData > 0) {
      stats.averageCaloriesPerDay = Math.round(stats.totalCalories / stats.daysWithData);
      stats.averageProteinPerDay = Math.round(stats.totalProtein / stats.daysWithData);
      stats.averageCarbsPerDay = Math.round(stats.totalCarbs / stats.daysWithData);
      stats.averageFatPerDay = Math.round(stats.totalFat / stats.daysWithData);
    }

    return stats;
  }, [data]);
}

/**
 * Hook to calculate daily macro percentages
 */
export function useDailyMacros(dayData: DayData | undefined) {
  return useMemo(() => {
    if (!dayData || !dayData.totalCalories) {
      return {
        proteinPercentage: 0,
        carbsPercentage: 0,
        fatPercentage: 0,
      };
    }

    const proteinCalories = (dayData.totalProtein || 0) * 4;
    const carbCalories = (dayData.totalCarbs || 0) * 4;
    const fatCalories = (dayData.totalFat || 0) * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    if (totalMacroCalories === 0) {
      return {
        proteinPercentage: 0,
        carbsPercentage: 0,
        fatPercentage: 0,
      };
    }

    return {
      proteinPercentage: Math.round((proteinCalories / totalMacroCalories) * 100),
      carbsPercentage: Math.round((carbCalories / totalMacroCalories) * 100),
      fatPercentage: Math.round((fatCalories / totalMacroCalories) * 100),
    };
  }, [dayData]);
}