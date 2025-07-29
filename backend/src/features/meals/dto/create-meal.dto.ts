import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Length,
  Matches,
  IsNumber,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { MealCategory } from "../entities/meal.entity";

export class CreateMealDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsEnum(MealCategory)
  category?: MealCategory;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in HH:MM format (24-hour)",
  })
  time?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsOptional()
  @IsString()
  userId?: string; // TODO: Get from auth context

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  foods?: CreateFoodEntryDto[];

  // Custom macro overrides
  @IsOptional()
  @IsNumber()
  @Min(0)
  customCalories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customProtein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customCarbs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customFat?: number;
}

export class CreateFoodEntryDto {
  @IsNotEmpty()
  @IsString()
  foodId: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  unit?: string = "g";
}
