import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MealsController } from "./meals.controller";
import { MealsService } from "./meals.service";
import { NutritionIntegrationService } from "./nutrition-integration.service";
import { Meal } from "./entities/meal.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { Food } from "../foods/entities/food.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Meal, FoodEntry, Food])],
  controllers: [MealsController],
  providers: [MealsService, NutritionIntegrationService],
  exports: [MealsService, NutritionIntegrationService],
})
export class MealsModule {}
