import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../features/users/entities/user.entity';
import { Meal } from '../features/meals/entities/meal.entity';
import { Food } from '../features/foods/entities/food.entity';
import { FoodEntry } from '../features/foods/entities/food-entry.entity';
import { DailyNutrition } from '../features/nutrition/entities/daily-nutrition.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DATABASE_PATH') || 'data/foodtracker.db',
        entities: [User, Meal, Food, FoodEntry, DailyNutrition],
        migrations: ['dist/database/migrations/*.js'],
        migrationsTableName: 'migrations',
        synchronize: true, // TODO: Use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
        // Ensure foreign key constraints are enabled in SQLite
        foreign_keys: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}