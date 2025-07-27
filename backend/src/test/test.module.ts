import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MealsModule } from "../features/meals/meals.module";
import { FoodsModule } from "../features/foods/foods.module";
import { NutritionModule } from "../features/nutrition/nutrition.module";
import { CalendarModule } from "../features/calendar/calendar.module";
import { UsersModule } from "../features/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env.test",
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    MealsModule,
    FoodsModule,
    NutritionModule,
    CalendarModule,
  ],
})
export class TestModule {}
