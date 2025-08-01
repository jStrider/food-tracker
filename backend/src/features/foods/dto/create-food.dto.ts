import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  Min,
  Max,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
  IsPositive,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateFoodDto {
  @ApiProperty({ 
    example: "Organic Banana",
    description: "Food name (2-200 characters)",
    minLength: 2,
    maxLength: 200
  })
  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  @Length(2, 200, { message: "Name must be between 2 and 200 characters" })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&'"/]+$/, { 
    message: "Name contains invalid characters" 
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ 
    example: "Dole",
    description: "Brand name (optional, max 100 characters)",
    required: false,
    maxLength: 100
  })
  @IsString({ message: "Brand must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "Brand must not exceed 100 characters" })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&'"/]+$/, { 
    message: "Brand contains invalid characters" 
  })
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @ApiProperty({ 
    example: "1234567890123",
    description: "Product barcode (optional, 8-20 characters)",
    required: false,
    minLength: 8,
    maxLength: 20
  })
  @IsString({ message: "Barcode must be a string" })
  @IsOptional()
  @Length(8, 20, { message: "Barcode must be between 8 and 20 characters" })
  @Matches(/^[0-9]+$/, { message: "Barcode must contain only numbers" })
  barcode?: string;

  @ApiProperty({ 
    example: 95,
    description: "Calories per serving (0-9999)",
    minimum: 0,
    maximum: 9999
  })
  @IsNumber({}, { message: "Calories must be a number" })
  @Type(() => Number)
  @Min(0, { message: "Calories must be non-negative" })
  @Max(9999, { message: "Calories must be less than 10000" })
  calories: number;

  @ApiProperty({ 
    example: 1.3,
    description: "Protein in grams (0-999)",
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: "Protein must be a number" })
  @Type(() => Number)
  @Min(0, { message: "Protein must be non-negative" })
  @Max(999, { message: "Protein must be less than 1000" })
  protein: number;

  @ApiProperty({ 
    example: 25,
    description: "Carbohydrates in grams (0-999)",
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: "Carbs must be a number" })
  @Type(() => Number)
  @Min(0, { message: "Carbs must be non-negative" })
  @Max(999, { message: "Carbs must be less than 1000" })
  carbs: number;

  @ApiProperty({ 
    example: 0.3,
    description: "Fat in grams (0-999)",
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: "Fat must be a number" })
  @Type(() => Number)
  @Min(0, { message: "Fat must be non-negative" })
  @Max(999, { message: "Fat must be less than 1000" })
  fat: number;

  @ApiProperty({ 
    example: 3.1,
    description: "Fiber in grams (optional, 0-999)",
    required: false,
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: "Fiber must be a number" })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: "Fiber must be non-negative" })
  @Max(999, { message: "Fiber must be less than 1000" })
  fiber?: number;

  @ApiProperty({ 
    example: 14,
    description: "Sugar in grams (optional, 0-999)",
    required: false,
    minimum: 0,
    maximum: 999
  })
  @IsNumber({}, { message: "Sugar must be a number" })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: "Sugar must be non-negative" })
  @Max(999, { message: "Sugar must be less than 1000" })
  sugar?: number;

  @ApiProperty({ 
    example: 1,
    description: "Sodium in milligrams (optional, 0-99999)",
    required: false,
    minimum: 0,
    maximum: 99999
  })
  @IsNumber({}, { message: "Sodium must be a number" })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: "Sodium must be non-negative" })
  @Max(99999, { message: "Sodium must be less than 100000" })
  sodium?: number;

  @ApiProperty({ 
    example: "1 medium (118g)",
    description: "Serving size description (optional, max 100 characters)",
    required: false,
    maxLength: 100
  })
  @IsString({ message: "Serving size must be a string" })
  @IsOptional()
  @MaxLength(100, { message: "Serving size must not exceed 100 characters" })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&'"/]+$/, { 
    message: "Serving size contains invalid characters" 
  })
  @Transform(({ value }) => value?.trim())
  servingSize?: string;

  @ApiProperty({ 
    example: "https://example.com/banana.jpg",
    description: "Image URL (optional, valid HTTPS URL)",
    required: false
  })
  @IsUrl({ protocols: ['https'] }, { message: "Image URL must be a valid HTTPS URL" })
  @IsOptional()
  @MaxLength(500, { message: "Image URL must not exceed 500 characters" })
  imageUrl?: string;
}
