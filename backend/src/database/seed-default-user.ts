import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../features/users/entities/user.entity';
import { Meal } from '../features/meals/entities/meal.entity';
import { FoodEntry } from '../features/foods/entities/food-entry.entity';
import { Food } from '../features/foods/entities/food.entity';

// Default user ID that matches the one in backend constant
const DEFAULT_USER_ID = 'a3aa41df-b467-40c8-867c-beb5edc4d032';

async function seedDefaultUser() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'foodtracker',
    password: process.env.DATABASE_PASSWORD || 'foodtracker_secure_password',
    database: process.env.DATABASE_NAME || 'foodtracker',
    entities: [User, Meal, FoodEntry, Food],
    synchronize: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('Data Source initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Check if default user already exists
    const existingUser = await userRepository.findOne({
      where: { id: DEFAULT_USER_ID }
    });

    if (existingUser) {
      console.log('Default user already exists');
      return;
    }

    // Create default user with hashed password
    const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
    
    const defaultUser = userRepository.create({
      id: DEFAULT_USER_ID,
      email: 'default@foodtracker.com',
      name: 'Default User',
      password: hashedPassword,
      timezone: 'Europe/Paris',
      preferences: {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        dailyCarbGoal: 250,
        dailyFatGoal: 65,
      }
    });

    await userRepository.save(defaultUser);
    console.log('Default user created successfully');

  } catch (error) {
    console.error('Error seeding default user:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seed
seedDefaultUser();