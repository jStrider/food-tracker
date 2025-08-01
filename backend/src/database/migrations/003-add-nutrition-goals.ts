import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class AddNutritionGoals1754075800000 implements MigrationInterface {
  name = 'AddNutritionGoals1754075800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "nutrition_goals",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))",
          },
          {
            name: "userId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "period",
            type: "varchar",
            default: "'daily'",
            isNullable: false,
          },
          {
            name: "goalType",
            type: "varchar",
            default: "'maintenance'",
            isNullable: false,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          // Core macronutrients
          {
            name: "calorieGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "proteinGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "carbGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "fatGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          // Extended nutrition goals
          {
            name: "fiberGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "sugarGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "sodiumGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "saturatedFatGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "cholesterolGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "potassiumGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          // Vitamin goals
          {
            name: "vitaminAGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "vitaminCGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "calciumGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "ironGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          // Hydration goal
          {
            name: "waterGoal",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 2000,
            isNullable: false,
          },
          // Goal ranges
          {
            name: "toleranceLower",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: 90,
            isNullable: false,
          },
          {
            name: "toleranceUpper",
            type: "decimal",
            precision: 5,
            scale: 2,
            default: 110,
            isNullable: false,
          },
          // Macro ratios
          {
            name: "proteinPercentage",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: "carbPercentage",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: "fatPercentage",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          // Date range
          {
            name: "startDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "endDate",
            type: "date",
            isNullable: true,
          },
          // Goal settings
          {
            name: "trackCalories",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "trackMacros",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "trackMicronutrients",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "trackWater",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          // Reminders
          {
            name: "enableReminders",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "reminderTimes",
            type: "text",
            isNullable: true,
          },
          // Timestamps
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["userId"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      "nutrition_goals",
      new Index("IDX_nutrition_goals_userId_period", ["userId", "period"])
    );

    await queryRunner.createIndex(
      "nutrition_goals",
      new Index("IDX_nutrition_goals_userId_isActive", ["userId", "isActive"])
    );

    // Create unique constraint for active goals per period per user
    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_nutrition_goals_unique_active_period 
      ON nutrition_goals (userId, period) 
      WHERE isActive = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("nutrition_goals", "IDX_nutrition_goals_unique_active_period");
    await queryRunner.dropIndex("nutrition_goals", "IDX_nutrition_goals_userId_isActive");
    await queryRunner.dropIndex("nutrition_goals", "IDX_nutrition_goals_userId_period");
    await queryRunner.dropTable("nutrition_goals");
  }
}