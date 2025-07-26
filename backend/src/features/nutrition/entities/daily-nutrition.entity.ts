import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('daily_nutrition')
@Unique(['userId', 'date']) // One record per user per day
@Index(['userId', 'date']) // Fast lookups by user and date
export class DailyNutrition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Actual consumed nutrition (calculated from meals)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCalories: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalProtein: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCarbs: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalFat: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalFiber: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSugar: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSodium: number;

  // Extended nutrition tracking
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSaturatedFat: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalTransFat: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCholesterol: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPotassium: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalVitaminA: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalVitaminC: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCalcium: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalIron: number;

  // Daily goals (can override user defaults)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  calorieGoal?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  proteinGoal?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  carbGoal?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  fatGoal?: number;

  // Meal count for the day
  @Column({ default: 0 })
  mealCount: number;

  // Water tracking (in ml)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  waterIntake: number;

  @Column('decimal', { precision: 10, scale: 2, default: 2000 })
  waterGoal: number;

  // Exercise tracking (optional)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  exerciseCaloriesBurned: number;

  // Notes for the day
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculate progress percentages
  get calorieProgress(): number {
    const goal = this.calorieGoal || this.user?.preferences?.dailyCalorieGoal || 2000;
    return Math.min((this.totalCalories / goal) * 100, 100);
  }

  get proteinProgress(): number {
    const goal = this.proteinGoal || this.user?.preferences?.dailyProteinGoal || 50;
    return Math.min((this.totalProtein / goal) * 100, 100);
  }

  get carbProgress(): number {
    const goal = this.carbGoal || this.user?.preferences?.dailyCarbGoal || 300;
    return Math.min((this.totalCarbs / goal) * 100, 100);
  }

  get fatProgress(): number {
    const goal = this.fatGoal || this.user?.preferences?.dailyFatGoal || 65;
    return Math.min((this.totalFat / goal) * 100, 100);
  }

  get waterProgress(): number {
    return Math.min((this.waterIntake / this.waterGoal) * 100, 100);
  }

  // Calculate net calories (consumed - burned)
  get netCalories(): number {
    return this.totalCalories - this.exerciseCaloriesBurned;
  }

  // Calculate macronutrient ratios
  get macroRatios() {
    const totalMacroCalories = (this.totalProtein * 4) + (this.totalCarbs * 4) + (this.totalFat * 9);
    
    if (totalMacroCalories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((this.totalProtein * 4 / totalMacroCalories) * 100),
      carbs: Math.round((this.totalCarbs * 4 / totalMacroCalories) * 100),
      fat: Math.round((this.totalFat * 9 / totalMacroCalories) * 100),
    };
  }

  // Get overall nutrition score (0-100)
  get nutritionScore(): number {
    const scores = [];

    // Calorie target adherence (80-120% is optimal)
    const caloriePercentage = this.calorieProgress;
    if (caloriePercentage >= 80 && caloriePercentage <= 120) scores.push(100);
    else if (caloriePercentage >= 70 && caloriePercentage <= 130) scores.push(80);
    else if (caloriePercentage >= 60 && caloriePercentage <= 140) scores.push(60);
    else scores.push(40);

    // Protein adequacy
    if (this.proteinProgress >= 90) scores.push(100);
    else if (this.proteinProgress >= 70) scores.push(80);
    else if (this.proteinProgress >= 50) scores.push(60);
    else scores.push(40);

    // Fiber intake (25g+ is good)
    if (this.totalFiber >= 25) scores.push(100);
    else if (this.totalFiber >= 20) scores.push(80);
    else if (this.totalFiber >= 15) scores.push(60);
    else scores.push(40);

    // Sugar intake (lower is better, <50g is good)
    if (this.totalSugar <= 25) scores.push(100);
    else if (this.totalSugar <= 50) scores.push(80);
    else if (this.totalSugar <= 75) scores.push(60);
    else scores.push(40);

    // Sodium intake (lower is better, <2300mg is good)
    if (this.totalSodium <= 1500) scores.push(100);
    else if (this.totalSodium <= 2300) scores.push(80);
    else if (this.totalSodium <= 3000) scores.push(60);
    else scores.push(40);

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Check if goals are met
  get goalsMetStatus() {
    return {
      calories: this.calorieProgress >= 90 && this.calorieProgress <= 110,
      protein: this.proteinProgress >= 90,
      carbs: this.carbProgress >= 80 && this.carbProgress <= 120,
      fat: this.fatProgress >= 80 && this.fatProgress <= 120,
      water: this.waterProgress >= 90,
    };
  }
}