import { IsEnum, IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalPeriod, GoalType } from '../entities/nutrition-goals.entity';

export class CreateNutritionGoalsDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  @IsEnum(GoalType)
  goalType: GoalType;

  @IsNumber()
  @Min(0)
  calorieGoal: number;

  @IsNumber()
  @Min(0)
  proteinGoal: number;

  @IsNumber()
  @Min(0)
  carbGoal: number;

  @IsNumber()
  @Min(0)
  fatGoal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fiberGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugarGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sodiumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFatGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cholesterolGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  potassiumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitaminAGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitaminCGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calciumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ironGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waterGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  toleranceLower?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(200)
  toleranceUpper?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proteinPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  carbPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fatPercentage?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  trackCalories?: boolean;

  @IsOptional()
  @IsBoolean()
  trackMacros?: boolean;

  @IsOptional()
  @IsBoolean()
  trackMicronutrients?: boolean;

  @IsOptional()
  @IsBoolean()
  trackWater?: boolean;

  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reminderTimes?: string[];
}

export class UpdateNutritionGoalsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalPeriod)
  period?: GoalPeriod;

  @IsOptional()
  @IsEnum(GoalType)
  goalType?: GoalType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calorieGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fatGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fiberGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugarGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sodiumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFatGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cholesterolGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  potassiumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitaminAGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vitaminCGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calciumGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ironGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waterGoal?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  toleranceLower?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(200)
  toleranceUpper?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proteinPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  carbPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fatPercentage?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  trackCalories?: boolean;

  @IsOptional()
  @IsBoolean()
  trackMacros?: boolean;

  @IsOptional()
  @IsBoolean()
  trackMicronutrients?: boolean;

  @IsOptional()
  @IsBoolean()
  trackWater?: boolean;

  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reminderTimes?: string[];
}

export class NutritionGoalsQueryDto {
  @IsOptional()
  @IsEnum(GoalPeriod)
  period?: GoalPeriod;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  goalType?: GoalType;
}

export class NutritionGoalsProgressDto {
  @IsString()
  goalId: string;

  @IsDateString()
  date: string;
}

export class BulkGoalsComparisonDto {
  @IsString()
  goalId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class GoalTemplateDto {
  @IsEnum(GoalType)
  goalType: GoalType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number; // kg

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number; // cm

  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  gender?: 'male' | 'female';

  @IsOptional()
  @IsString()
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}