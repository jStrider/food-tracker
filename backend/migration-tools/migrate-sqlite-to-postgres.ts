import { DataSource } from 'typeorm';
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface UserRow {
  id: string;
  email: string;
  name: string;
  password: string;
  timezone: string;
  preferences: string;
  createdAt: string;
  updatedAt: string;
}

export async function migrateSQLiteToPostgres() {
  console.log('🚀 Starting SQLite to PostgreSQL migration...');
  
  // Connect to SQLite
  const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '../../../data/foodtracker.db');
  const sqliteDb = new sqlite3.Database(sqlitePath);
  const allAsync = promisify(sqliteDb.all).bind(sqliteDb);
  
  // Connect to PostgreSQL
  const pgDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'foodtracker',
    password: process.env.DATABASE_PASSWORD || 'foodtracker_secure_password',
    database: process.env.DATABASE_NAME || 'foodtracker',
    synchronize: false,
    logging: true,
  });
  
  try {
    await pgDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');
    
    // Start transaction
    await pgDataSource.query('BEGIN');
    
    // 1. Migrate Users
    console.log('📋 Migrating users...');
    const users = await allAsync('SELECT * FROM users') as UserRow[];
    for (const user of users) {
      await pgDataSource.query(
        `INSERT INTO users (id, email, name, password, timezone, preferences, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         timezone = EXCLUDED.timezone,
         preferences = EXCLUDED.preferences,
         "updatedAt" = EXCLUDED."updatedAt"`,
        [
          user.id,
          user.email,
          user.name,
          user.password,
          user.timezone || 'UTC',
          user.preferences || '{}',
          new Date(user.createdAt),
          new Date(user.updatedAt)
        ]
      );
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // 2. Migrate Meals
    console.log('📋 Migrating meals...');
    const meals = await allAsync('SELECT * FROM meals');
    for (const meal of meals) {
      await pgDataSource.query(
        `INSERT INTO meals (id, "userId", category, date, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
         "userId" = EXCLUDED."userId",
         category = EXCLUDED.category,
         date = EXCLUDED.date,
         "updatedAt" = EXCLUDED."updatedAt"`,
        [
          meal.id,
          meal.userId,
          meal.category,
          meal.date,
          new Date(meal.createdAt),
          new Date(meal.updatedAt)
        ]
      );
    }
    console.log(`✅ Migrated ${meals.length} meals`);
    
    // 3. Migrate Foods
    console.log('📋 Migrating foods...');
    const foods = await allAsync('SELECT * FROM foods');
    for (const food of foods) {
      await pgDataSource.query(
        `INSERT INTO foods (id, barcode, "productName", brand, calories, protein, carbohydrates, fat, fiber, sugar, sodium, "servingSize", "servingUnit", "imageUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
         barcode = EXCLUDED.barcode,
         "productName" = EXCLUDED."productName",
         brand = EXCLUDED.brand,
         calories = EXCLUDED.calories,
         protein = EXCLUDED.protein,
         carbohydrates = EXCLUDED.carbohydrates,
         fat = EXCLUDED.fat,
         fiber = EXCLUDED.fiber,
         sugar = EXCLUDED.sugar,
         sodium = EXCLUDED.sodium,
         "servingSize" = EXCLUDED."servingSize",
         "servingUnit" = EXCLUDED."servingUnit",
         "imageUrl" = EXCLUDED."imageUrl",
         "updatedAt" = EXCLUDED."updatedAt"`,
        [
          food.id,
          food.barcode,
          food.productName,
          food.brand,
          food.calories,
          food.protein,
          food.carbohydrates,
          food.fat,
          food.fiber,
          food.sugar,
          food.sodium,
          food.servingSize,
          food.servingUnit,
          food.imageUrl,
          new Date(food.createdAt),
          new Date(food.updatedAt)
        ]
      );
    }
    console.log(`✅ Migrated ${foods.length} foods`);
    
    // 4. Migrate Food Entries
    console.log('📋 Migrating food entries...');
    const foodEntries = await allAsync('SELECT * FROM food_entries');
    for (const entry of foodEntries) {
      await pgDataSource.query(
        `INSERT INTO food_entries (id, "mealId", "foodId", quantity, unit, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         "mealId" = EXCLUDED."mealId",
         "foodId" = EXCLUDED."foodId",
         quantity = EXCLUDED.quantity,
         unit = EXCLUDED.unit,
         "updatedAt" = EXCLUDED."updatedAt"`,
        [
          entry.id,
          entry.mealId,
          entry.foodId,
          entry.quantity,
          entry.unit,
          new Date(entry.createdAt),
          new Date(entry.updatedAt)
        ]
      );
    }
    console.log(`✅ Migrated ${foodEntries.length} food entries`);
    
    // 5. Migrate Daily Nutrition
    console.log('📋 Migrating daily nutrition...');
    const dailyNutrition = await allAsync('SELECT * FROM daily_nutrition');
    for (const nutrition of dailyNutrition) {
      await pgDataSource.query(
        `INSERT INTO daily_nutrition (id, "userId", date, "totalCalories", "totalProtein", "totalCarbohydrates", "totalFat", "totalFiber", "totalSugar", "totalSodium", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
         "userId" = EXCLUDED."userId",
         date = EXCLUDED.date,
         "totalCalories" = EXCLUDED."totalCalories",
         "totalProtein" = EXCLUDED."totalProtein",
         "totalCarbohydrates" = EXCLUDED."totalCarbohydrates",
         "totalFat" = EXCLUDED."totalFat",
         "totalFiber" = EXCLUDED."totalFiber",
         "totalSugar" = EXCLUDED."totalSugar",
         "totalSodium" = EXCLUDED."totalSodium",
         "updatedAt" = EXCLUDED."updatedAt"`,
        [
          nutrition.id,
          nutrition.userId,
          nutrition.date,
          nutrition.totalCalories || 0,
          nutrition.totalProtein || 0,
          nutrition.totalCarbohydrates || 0,
          nutrition.totalFat || 0,
          nutrition.totalFiber || 0,
          nutrition.totalSugar || 0,
          nutrition.totalSodium || 0,
          new Date(nutrition.createdAt),
          new Date(nutrition.updatedAt)
        ]
      );
    }
    console.log(`✅ Migrated ${dailyNutrition.length} daily nutrition records`);
    
    // Commit transaction
    await pgDataSource.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pgDataSource.query('ROLLBACK');
    throw error;
  } finally {
    await pgDataSource.destroy();
    sqliteDb.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSQLiteToPostgres()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}