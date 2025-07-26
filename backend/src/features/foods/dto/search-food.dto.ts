import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SearchFoodDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  query?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(13)
  barcode?: string;
}

export class FoodSearchResultDto {
  id?: string;
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
  servingSize: string;
  imageUrl?: string;
  isFromCache: boolean;
  confidence?: number; // For search relevance scoring
}