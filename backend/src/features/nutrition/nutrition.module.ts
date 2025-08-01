import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NutritionController } from "./nutrition.controller";
import { NutritionService } from "./nutrition.service";
import { NutritionGoalsService } from "./services/nutrition-goals.service";
import { NutritionGoalsController } from "./controllers/nutrition-goals.controller";
import { Meal } from "../meals/entities/meal.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { DailyNutrition } from "./entities/daily-nutrition.entity";
import { NutritionGoals } from "./entities/nutrition-goals.entity";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Meal, FoodEntry, DailyNutrition, NutritionGoals, User])],
  controllers: [NutritionController, NutritionGoalsController],
  providers: [NutritionService, NutritionGoalsService],
  exports: [NutritionService, NutritionGoalsService, TypeOrmModule],
})
export class NutritionModule {}
