import { Expose, Type } from "class-transformer";
import { MealCategory } from "../entities/meal.entity";

export class FoodSummaryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  brand?: string;

  @Expose()
  calories: number;

  @Expose()
  protein: number;

  @Expose()
  carbs: number;

  @Expose()
  fat: number;

  @Expose()
  fiber: number;

  @Expose()
  sugar: number;

  @Expose()
  sodium: number;

  @Expose()
  servingSize: string;

  @Expose()
  imageUrl?: string;
}

export class FoodEntryResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantity: number;

  @Expose()
  unit: string;

  @Expose()
  calculatedCalories: number;

  @Expose()
  calculatedProtein: number;

  @Expose()
  calculatedCarbs: number;

  @Expose()
  calculatedFat: number;

  @Expose()
  @Type(() => FoodSummaryDto)
  food: FoodSummaryDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class MealResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  category: MealCategory;

  @Expose()
  date: Date;

  @Expose()
  time?: string;

  @Expose()
  notes?: string;

  @Expose()
  @Type(() => FoodEntryResponseDto)
  foods: FoodEntryResponseDto[];

  @Expose()
  totalCalories: number;

  @Expose()
  totalProtein: number;

  @Expose()
  totalCarbs: number;

  @Expose()
  totalFat: number;

  @Expose()
  totalFiber: number;

  @Expose()
  totalSugar: number;

  @Expose()
  totalSodium: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class MealSummaryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  category: MealCategory;

  @Expose()
  date: Date;

  @Expose()
  time?: string;

  @Expose()
  totalCalories: number;

  @Expose()
  totalProtein: number;

  @Expose()
  totalCarbs: number;

  @Expose()
  totalFat: number;

  @Expose()
  foodCount: number;

  @Expose()
  createdAt: Date;
}

export class DailyNutritionDto {
  @Expose()
  date: string;

  @Expose()
  @Type(() => MealSummaryDto)
  meals: MealSummaryDto[];

  @Expose()
  totalCalories: number;

  @Expose()
  totalProtein: number;

  @Expose()
  totalCarbs: number;

  @Expose()
  totalFat: number;

  @Expose()
  totalFiber: number;

  @Expose()
  totalSugar: number;

  @Expose()
  totalSodium: number;

  @Expose()
  mealCount: number;
}

export class MealStatsDto {
  @Expose()
  totalMeals: number;

  @Expose()
  averageCalories: number;

  @Expose()
  averageProtein: number;

  @Expose()
  averageCarbs: number;

  @Expose()
  averageFat: number;

  @Expose()
  mostCommonCategory: MealCategory;

  @Expose()
  dateRange: {
    start: string;
    end: string;
  };
}
