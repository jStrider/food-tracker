import { DataSource } from 'typeorm';
import { User } from '../features/users/entities/user.entity';
import { Meal } from '../features/meals/entities/meal.entity';
import { Food } from '../features/foods/entities/food.entity';
import { FoodEntry } from '../features/foods/entities/food-entry.entity';
import { DailyNutrition } from '../features/nutrition/entities/daily-nutrition.entity';

// Data source for migrations and CLI operations
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || 'data/foodtracker.db',
  entities: [User, Meal, Food, FoodEntry, DailyNutrition],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
});

// Initialize data source
export const initializeDataSource = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};