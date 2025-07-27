import { IsEmail, IsString, IsOptional, IsObject } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    dailyCalorieGoal?: number;
    dailyProteinGoal?: number;
    dailyCarbGoal?: number;
    dailyFatGoal?: number;
    defaultMealCategories?: {
      breakfast: { startTime: string; endTime: string };
      lunch: { startTime: string; endTime: string };
      dinner: { startTime: string; endTime: string };
      snack: { startTime: string; endTime: string };
    };
  };
}
