import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1640000000000 implements MigrationInterface {
  name = "InitialSchema1640000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar NOT NULL,
        "name" varchar NOT NULL,
        "timezone" varchar,
        "preferences" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
      )
    `);

    // Create foods table
    await queryRunner.query(`
      CREATE TABLE "foods" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "brand" varchar,
        "barcode" varchar,
        "source" varchar NOT NULL DEFAULT ('manual'),
        "openFoodFactsId" varchar,
        "openFoodFactsData" text,
        "calories" decimal(10,2) NOT NULL DEFAULT (0),
        "protein" decimal(10,2) NOT NULL DEFAULT (0),
        "carbs" decimal(10,2) NOT NULL DEFAULT (0),
        "fat" decimal(10,2) NOT NULL DEFAULT (0),
        "fiber" decimal(10,2) NOT NULL DEFAULT (0),
        "sugar" decimal(10,2) NOT NULL DEFAULT (0),
        "sodium" decimal(10,2) NOT NULL DEFAULT (0),
        "saturatedFat" decimal(10,2) DEFAULT (0),
        "transFat" decimal(10,2) DEFAULT (0),
        "cholesterol" decimal(10,2) DEFAULT (0),
        "potassium" decimal(10,2) DEFAULT (0),
        "vitaminA" decimal(10,2) DEFAULT (0),
        "vitaminC" decimal(10,2) DEFAULT (0),
        "calcium" decimal(10,2) DEFAULT (0),
        "iron" decimal(10,2) DEFAULT (0),
        "servingSize" varchar NOT NULL DEFAULT ('100g'),
        "imageUrl" varchar,
        "ingredients" text,
        "allergens" text,
        "categories" text,
        "isCached" boolean NOT NULL DEFAULT (0),
        "lastSyncedAt" datetime,
        "usageCount" integer NOT NULL DEFAULT (0),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create meals table
    await queryRunner.query(`
      CREATE TABLE "meals" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "category" varchar NOT NULL DEFAULT ('snack'),
        "date" date NOT NULL,
        "time" time,
        "isCustomCategory" boolean NOT NULL DEFAULT (0),
        "userId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_user_meals" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // Create food_entries table
    await queryRunner.query(`
      CREATE TABLE "food_entries" (
        "id" varchar PRIMARY KEY NOT NULL,
        "quantity" decimal(10,2) NOT NULL,
        "unit" varchar NOT NULL DEFAULT ('g'),
        "mealId" varchar NOT NULL,
        "foodId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_meal_food_entries" FOREIGN KEY ("mealId") REFERENCES "meals" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_food_food_entries" FOREIGN KEY ("foodId") REFERENCES "foods" ("id")
      )
    `);

    // Create daily_nutrition table
    await queryRunner.query(`
      CREATE TABLE "daily_nutrition" (
        "id" varchar PRIMARY KEY NOT NULL,
        "date" date NOT NULL,
        "userId" varchar NOT NULL,
        "totalCalories" decimal(10,2) NOT NULL DEFAULT (0),
        "totalProtein" decimal(10,2) NOT NULL DEFAULT (0),
        "totalCarbs" decimal(10,2) NOT NULL DEFAULT (0),
        "totalFat" decimal(10,2) NOT NULL DEFAULT (0),
        "totalFiber" decimal(10,2) NOT NULL DEFAULT (0),
        "totalSugar" decimal(10,2) NOT NULL DEFAULT (0),
        "totalSodium" decimal(10,2) NOT NULL DEFAULT (0),
        "totalSaturatedFat" decimal(10,2) NOT NULL DEFAULT (0),
        "totalTransFat" decimal(10,2) NOT NULL DEFAULT (0),
        "totalCholesterol" decimal(10,2) NOT NULL DEFAULT (0),
        "totalPotassium" decimal(10,2) NOT NULL DEFAULT (0),
        "totalVitaminA" decimal(10,2) NOT NULL DEFAULT (0),
        "totalVitaminC" decimal(10,2) NOT NULL DEFAULT (0),
        "totalCalcium" decimal(10,2) NOT NULL DEFAULT (0),
        "totalIron" decimal(10,2) NOT NULL DEFAULT (0),
        "calorieGoal" decimal(10,2),
        "proteinGoal" decimal(10,2),
        "carbGoal" decimal(10,2),
        "fatGoal" decimal(10,2),
        "mealCount" integer NOT NULL DEFAULT (0),
        "waterIntake" decimal(10,2) NOT NULL DEFAULT (0),
        "waterGoal" decimal(10,2) NOT NULL DEFAULT (2000),
        "exerciseCaloriesBurned" decimal(10,2) NOT NULL DEFAULT (0),
        "notes" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_user_daily_nutrition" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_date_nutrition" UNIQUE ("userId", "date")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_foods_barcode_source" ON "foods" ("barcode", "source")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_foods_name" ON "foods" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_daily_nutrition_user_date" ON "daily_nutrition" ("userId", "date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_meals_user_date" ON "meals" ("userId", "date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_meals_date" ON "meals" ("date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_meals_date"`);
    await queryRunner.query(`DROP INDEX "IDX_meals_user_date"`);
    await queryRunner.query(`DROP INDEX "IDX_daily_nutrition_user_date"`);
    await queryRunner.query(`DROP INDEX "IDX_foods_name"`);
    await queryRunner.query(`DROP INDEX "IDX_foods_barcode_source"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "daily_nutrition"`);
    await queryRunner.query(`DROP TABLE "food_entries"`);
    await queryRunner.query(`DROP TABLE "meals"`);
    await queryRunner.query(`DROP TABLE "foods"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
