import { Module } from "@nestjs/common";
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
      type: "sqlite",
      database: ":memory:",
      entities: [User, Meal, Food, FoodEntry, DailyNutrition],
      synchronize: true,
      logging: false,
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
})
export class TestAppModule {}
