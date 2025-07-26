import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Feature modules
import { UsersModule } from './features/users/users.module';
import { MealsModule } from './features/meals/meals.module';
import { FoodsModule } from './features/foods/foods.module';
import { NutritionModule } from './features/nutrition/nutrition.module';
import { CalendarModule } from './features/calendar/calendar.module';

// Common modules
import { DatabaseModule } from './database/database.module';
import { McpModule } from './mcp/mcp.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    McpModule,
    UsersModule,
    MealsModule,
    FoodsModule,
    NutritionModule,
    CalendarModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}