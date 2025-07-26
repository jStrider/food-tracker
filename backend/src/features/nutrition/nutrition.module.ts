import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { Meal } from '../meals/entities/meal.entity';
import { FoodEntry } from '../foods/entities/food-entry.entity';
import { DailyNutrition } from './entities/daily-nutrition.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, FoodEntry, DailyNutrition, User]),
  ],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService, TypeOrmModule],
})
export class NutritionModule {}