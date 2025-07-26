import { MealCategory } from '../types';

// Food DTOs
export interface CreateFoodDto {
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  imageUrl?: string;
}

export interface UpdateFoodDto {
  name?: string;
  brand?: string;
  barcode?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  imageUrl?: string;
}

// Meal DTOs
export interface CreateMealDto {
  name: string;
  category: MealCategory;
  date: string;
}

export interface UpdateMealDto {
  name?: string;
  category?: MealCategory;
  date?: string;
}

// FoodEntry DTOs
export interface CreateFoodEntryDto {
  foodId: string;
  quantity: number;
  unit?: string;
}

export interface UpdateFoodEntryDto {
  foodId?: string;
  quantity?: number;
  unit?: string;
}

// Search DTOs
export interface FoodSearchDto {
  query?: string;
  barcode?: string;
  page?: number;
  limit?: number;
}

export interface MealSearchDto {
  date?: string;
  category?: MealCategory;
  startDate?: string;
  endDate?: string;
}

// Nutrition DTOs
export interface NutritionQueryDto {
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

// MCP DTOs
export interface McpToolCallDto {
  toolName: string;
  params: Record<string, any>;
}

export interface McpResourceRequestDto {
  resourceUri: string;
}