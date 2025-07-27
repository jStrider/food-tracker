import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "../features/auth/auth.module";
import { UsersModule } from "../features/users/users.module";
import { MealsModule } from "../features/meals/meals.module";
import { FoodsModule } from "../features/foods/foods.module";
import { NutritionModule } from "../features/nutrition/nutrition.module";
import { CalendarModule } from "../features/calendar/calendar.module";
import { User } from "../features/users/entities/user.entity";
import { Meal } from "../features/meals/entities/meal.entity";
import { Food } from "../features/foods/entities/food.entity";
import { FoodEntry } from "../features/foods/entities/food-entry.entity";
import { DailyNutrition } from "../features/nutrition/entities/daily-nutrition.entity";
import { JwtAuthGuard } from "../features/auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env.test",
      ignoreEnvFile: true,
      load: [
        () => ({
          JWT_SECRET: "test-secret-key",
          JWT_EXPIRES_IN: "7d",
          NODE_ENV: "test",
        }),
      ],
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.TEST_DB_HOST || "localhost",
      port: parseInt(process.env.TEST_DB_PORT || "5432"),
      username: process.env.TEST_DB_USERNAME || "foodtracker_test",
      password: process.env.TEST_DB_PASSWORD || "testpass",
      database: process.env.TEST_DB_NAME || "foodtracker_test",
      entities: [User, Meal, Food, FoodEntry, DailyNutrition],
      synchronize: true,
      logging: false,
      dropSchema: true, // Drop schema on each test run
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: "test-secret-key",
      signOptions: { expiresIn: "7d" },
    }),
    AuthModule,
    UsersModule,
    MealsModule,
    FoodsModule,
    NutritionModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class TestAppModule {}
