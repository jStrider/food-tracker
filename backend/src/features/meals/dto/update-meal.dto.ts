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
} from "class-validator";
import { Type } from "class-transformer";
import { MealCategory } from "../entities/meal.entity";

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
