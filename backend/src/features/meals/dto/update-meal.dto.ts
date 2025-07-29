import { PartialType } from "@nestjs/mapped-types";
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Length,
  Matches,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { MealCategory } from "../entities/meal.entity";
import { CreateFoodEntryDto } from "./create-meal.dto";

export class UpdateMealDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEnum(MealCategory)
  category?: MealCategory;

  @IsOptional()
  @IsDateString()
  date?: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFoodEntryDto)
  foods?: UpdateFoodEntryDto[];

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

export class UpdateFoodEntryDto extends PartialType(CreateFoodEntryDto) {
  @IsOptional()
  @IsString()
  id?: string; // For updating existing food entries

  @IsOptional()
  @IsString()
  foodId?: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  unit?: string;
}
