import { IsString, IsNumber, IsOptional, Min, Max, IsUUID, IsIn } from 'class-validator';

export class CreateFoodEntryDto {
  @IsUUID()
  foodId: string;

  @IsNumber()
  @Min(0.1)
  @Max(10000)
  quantity: number;

  @IsString()
  @IsOptional()
  @IsIn(['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice'])
  unit?: string = 'g';
}