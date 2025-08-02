import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../features/users/entities/user.entity";
import { Meal } from "../features/meals/entities/meal.entity";
import { Food } from "../features/foods/entities/food.entity";
import { FoodEntry } from "../features/foods/entities/food-entry.entity";
import { DailyNutrition } from "../features/nutrition/entities/daily-nutrition.entity";
import { getOptimizedTypeOrmConfig } from "../config/typeorm.config";
import { DatabaseInitService } from "./database-init.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getOptimizedTypeOrmConfig,
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [DatabaseInitService],
  exports: [DatabaseInitService],
})
export class DatabaseModule {}
