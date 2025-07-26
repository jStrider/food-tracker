import { IsString, IsOptional, IsNumber, IsUrl, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  @Max(9999)
  calories: number;

  @IsNumber()
  @Min(0)
  @Max(999)
  protein: number;

  @IsNumber()
  @Min(0)
  @Max(999)
  carbs: number;

  @IsNumber()
  @Min(0)
  @Max(999)
  fat: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999)
  fiber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999)
  sugar?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(99999)
  sodium?: number;

  @IsString()
  @IsOptional()
  servingSize?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}