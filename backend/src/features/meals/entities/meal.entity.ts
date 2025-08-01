import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { FoodEntry } from "../../foods/entities/food-entry.entity";
import { User } from "../../users/entities/user.entity";

export enum MealCategory {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
  SNACK = "snack",
}

@Entity("meals")
export class Meal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    enum: MealCategory,
    default: MealCategory.SNACK,
  })
  category: MealCategory;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "time", nullable: true })
  time?: string; // HH:MM format for auto-categorization

  @Column({ default: false })
  isCustomCategory: boolean;

  // Custom macro overrides
  @Column({ type: "int", nullable: true })
  customCalories?: number;

  @Column({ type: "decimal", precision: 5, scale: 1, nullable: true })
  customProtein?: number;

  @Column({ type: "decimal", precision: 5, scale: 1, nullable: true })
  customCarbs?: number;

  @Column({ type: "decimal", precision: 5, scale: 1, nullable: true })
  customFat?: number; // If true, category was manually set

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.meals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => FoodEntry, (foodEntry) => foodEntry.meal, { cascade: true })
  foods: FoodEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  autoCategorizeByTime() {
    // Only auto-categorize if not manually set and time is provided
    if (!this.isCustomCategory && this.time) {
      this.category = this.determineCategoryByTime(this.time);
    }
  }

  private determineCategoryByTime(time: string): MealCategory {
    const [hours] = time.split(":").map(Number);

    // Default time ranges - can be customized per user
    if (hours >= 5 && hours < 11) {
      return MealCategory.BREAKFAST;
    } else if (hours >= 11 && hours < 16) {
      return MealCategory.LUNCH;
    } else if (hours >= 16 && hours < 22) {
      return MealCategory.DINNER;
    } else {
      return MealCategory.SNACK;
    }
  }

  // Calculate total nutrition for this meal
  get totalCalories(): number {
    // Use custom value if provided, otherwise calculate from food entries
    if (this.customCalories !== null && this.customCalories !== undefined) {
      return this.customCalories;
    }
    return (
      this.foods?.reduce(
        (total, foodEntry) => total + foodEntry.calculatedCalories,
        0,
      ) || 0
    );
  }

  get totalProtein(): number {
    // Use custom value if provided, otherwise calculate from food entries
    if (this.customProtein !== null && this.customProtein !== undefined) {
      return Number(this.customProtein);
    }
    return (
      this.foods?.reduce(
        (total, foodEntry) => total + foodEntry.calculatedProtein,
        0,
      ) || 0
    );
  }

  get totalCarbs(): number {
    // Use custom value if provided, otherwise calculate from food entries
    if (this.customCarbs !== null && this.customCarbs !== undefined) {
      return Number(this.customCarbs);
    }
    return (
      this.foods?.reduce(
        (total, foodEntry) => total + foodEntry.calculatedCarbs,
        0,
      ) || 0
    );
  }

  get totalFat(): number {
    // Use custom value if provided, otherwise calculate from food entries
    if (this.customFat !== null && this.customFat !== undefined) {
      return Number(this.customFat);
    }
    return (
      this.foods?.reduce(
        (total, foodEntry) => total + foodEntry.calculatedFat,
        0,
      ) || 0
    );
  }

  get totalFiber(): number {
    return (
      this.foods?.reduce(
        (total, foodEntry) =>
          total + (foodEntry.food.fiber * foodEntry.quantity) / 100,
        0,
      ) || 0
    );
  }

  get totalSugar(): number {
    return (
      this.foods?.reduce(
        (total, foodEntry) =>
          total + (foodEntry.food.sugar * foodEntry.quantity) / 100,
        0,
      ) || 0
    );
  }

  get totalSodium(): number {
    return (
      this.foods?.reduce(
        (total, foodEntry) =>
          total + (foodEntry.food.sodium * foodEntry.quantity) / 100,
        0,
      ) || 0
    );
  }
}
