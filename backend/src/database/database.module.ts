import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../features/users/entities/user.entity";
import { Meal } from "../features/meals/entities/meal.entity";
import { Food } from "../features/foods/entities/food.entity";
import { FoodEntry } from "../features/foods/entities/food-entry.entity";
import { DailyNutrition } from "../features/nutrition/entities/daily-nutrition.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        host: configService.get<string>("DATABASE_HOST", "localhost"),
        port: configService.get<number>("DATABASE_PORT", 5432),
        username: configService.get<string>("DATABASE_USER", "foodtracker"),
        password: configService.get<string>(
          "DATABASE_PASSWORD",
          "foodtracker_secure_password",
        ),
        database: configService.get<string>("DATABASE_NAME", "foodtracker"),
        entities: [User, Meal, Food, FoodEntry, DailyNutrition],
        migrations: ["dist/database/migrations/*.js"],
        migrationsTableName: "typeorm_migrations",
        synchronize: true, // TEMPORARY: Should use migrations in production
        logging: configService.get("NODE_ENV") === "development",
        ssl:
          configService.get("DATABASE_SSL") === "true"
            ? {
                rejectUnauthorized: false,
              }
            : false,
        poolSize: configService.get<number>("DATABASE_POOL_SIZE", 10),
        connectTimeoutMS: configService.get<number>(
          "DATABASE_CONNECT_TIMEOUT",
          10000,
        ),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
