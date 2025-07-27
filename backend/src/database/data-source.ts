import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as dotenv from "dotenv";
import { User } from "../features/users/entities/user.entity";
import { Meal } from "../features/meals/entities/meal.entity";
import { Food } from "../features/foods/entities/food.entity";
import { FoodEntry } from "../features/foods/entities/food-entry.entity";
import { DailyNutrition } from "../features/nutrition/entities/daily-nutrition.entity";

dotenv.config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: configService.get("DATABASE_HOST", "localhost"),
  port: configService.get("DATABASE_PORT", 5432),
  username: configService.get("DATABASE_USER", "foodtracker"),
  password: configService.get(
    "DATABASE_PASSWORD",
    "foodtracker_secure_password",
  ),
  database: configService.get("DATABASE_NAME", "foodtracker"),
  entities: [User, Meal, Food, FoodEntry, DailyNutrition],
  migrations: ["src/database/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",
  ssl:
    configService.get("DATABASE_SSL") === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
