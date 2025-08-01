import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MAINTENANCE = 'maintenance',
  MUSCLE_GAIN = 'muscle_gain',
  ATHLETIC_PERFORMANCE = 'athletic_performance',
  CUSTOM = 'custom',
}

@Entity("nutrition_goals")
@Unique(["userId", "period", "isActive"]) // One active goal per period per user
@Index(["userId", "period"])
@Index(["userId", "isActive"])
export class NutritionGoals {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  // Goal metadata
  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: GoalPeriod,
    default: GoalPeriod.DAILY,
  })
  period: GoalPeriod;

  @Column({
    type: "enum",
    enum: GoalType,
    default: GoalType.MAINTENANCE,
  })
  goalType: GoalType;

  @Column({ default: true })
  isActive: boolean;

  // Core macronutrients
  @Column("decimal", { precision: 10, scale: 2 })
  calorieGoal: number;

  @Column("decimal", { precision: 10, scale: 2 })
  proteinGoal: number;

  @Column("decimal", { precision: 10, scale: 2 })
  carbGoal: number;

  @Column("decimal", { precision: 10, scale: 2 })
  fatGoal: number;

  // Extended nutrition goals
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  fiberGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  sugarGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  sodiumGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  saturatedFatGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  cholesterolGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  potassiumGoal?: number;

  // Vitamin goals
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  vitaminAGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  vitaminCGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  calciumGoal?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  ironGoal?: number;

  // Hydration goal
  @Column("decimal", { precision: 10, scale: 2, default: 2000 })
  waterGoal: number;

  // Goal ranges (for flexible goals)
  @Column("decimal", { precision: 5, scale: 2, default: 90 })
  toleranceLower: number; // 90% means 90-110% is "met"

  @Column("decimal", { precision: 5, scale: 2, default: 110 })
  toleranceUpper: number;

  // Macro ratios (percentage targets)
  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  proteinPercentage?: number; // Target percentage of calories from protein

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  carbPercentage?: number;

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  fatPercentage?: number;

  // Date range for goal (optional)
  @Column({ type: "date", nullable: true })
  startDate?: Date;

  @Column({ type: "date", nullable: true })
  endDate?: Date;

  // Goal settings
  @Column({ default: true })
  trackCalories: boolean;

  @Column({ default: true })
  trackMacros: boolean;

  @Column({ default: false })
  trackMicronutrients: boolean;

  @Column({ default: true })
  trackWater: boolean;

  // Reminders and notifications
  @Column({ default: false })
  enableReminders: boolean;

  @Column({ type: "simple-array", nullable: true })
  reminderTimes?: string[]; // ["08:00", "12:00", "18:00"]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculated properties
  get totalGoalCalories(): number {
    return this.calorieGoal;
  }

  get macroCaloriesSum(): number {
    return (this.proteinGoal * 4) + (this.carbGoal * 4) + (this.fatGoal * 9);
  }

  get calculatedMacroRatios() {
    const totalMacroCalories = this.macroCaloriesSum;
    if (totalMacroCalories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round(((this.proteinGoal * 4) / totalMacroCalories) * 100),
      carbs: Math.round(((this.carbGoal * 4) / totalMacroCalories) * 100),
      fat: Math.round(((this.fatGoal * 9) / totalMacroCalories) * 100),
    };
  }

  // Validation helpers
  get isValid(): boolean {
    const hasBasicGoals = this.calorieGoal > 0 && this.proteinGoal > 0 && 
                         this.carbGoal > 0 && this.fatGoal > 0;
    const hasValidTolerance = this.toleranceLower > 0 && this.toleranceUpper > this.toleranceLower;
    return hasBasicGoals && hasValidTolerance;
  }

  get macroConsistency(): { isConsistent: boolean; difference: number } {
    const macroCalories = this.macroCaloriesSum;
    const difference = Math.abs(this.calorieGoal - macroCalories);
    const isConsistent = difference <= (this.calorieGoal * 0.05); // 5% tolerance
    
    return { isConsistent, difference };
  }

  // Helper method to determine goal status
  getGoalStatus(actual: number, goal: number): 'under' | 'met' | 'over' {
    const percentage = (actual / goal) * 100;
    if (percentage < this.toleranceLower) return 'under';
    if (percentage <= this.toleranceUpper) return 'met';
    return 'over';
  }

  // Get goal for specific nutrient
  getGoalForNutrient(nutrient: string): number | undefined {
    const goalMap: Record<string, keyof this> = {
      'calories': 'calorieGoal',
      'protein': 'proteinGoal',
      'carbs': 'carbGoal',
      'fat': 'fatGoal',
      'fiber': 'fiberGoal',
      'sugar': 'sugarGoal',
      'sodium': 'sodiumGoal',
      'saturatedFat': 'saturatedFatGoal',
      'cholesterol': 'cholesterolGoal',
      'potassium': 'potassiumGoal',
      'vitaminA': 'vitaminAGoal',
      'vitaminC': 'vitaminCGoal',
      'calcium': 'calciumGoal',
      'iron': 'ironGoal',
      'water': 'waterGoal',
    };

    const goalProperty = goalMap[nutrient];
    if (goalProperty) {
      return this[goalProperty] as number;
    }
    return undefined;
  }
}