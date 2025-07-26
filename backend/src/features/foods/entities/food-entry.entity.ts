import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Meal } from '../../meals/entities/meal.entity';
import { Food } from './food.entity';

@Entity('food_entries')
export class FoodEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // in grams

  @Column({ default: 'g' })
  unit: string;

  @Column()
  mealId: string;

  @Column()
  foodId: string;

  @ManyToOne(() => Meal, (meal) => meal.foods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mealId' })
  meal: Meal;

  @ManyToOne(() => Food, { eager: true })
  @JoinColumn({ name: 'foodId' })
  food: Food;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculated nutrition based on quantity
  get calculatedCalories(): number {
    return (this.food.calories * this.quantity) / 100;
  }

  get calculatedProtein(): number {
    return (this.food.protein * this.quantity) / 100;
  }

  get calculatedCarbs(): number {
    return (this.food.carbs * this.quantity) / 100;
  }

  get calculatedFat(): number {
    return (this.food.fat * this.quantity) / 100;
  }

  get calculatedFiber(): number {
    return (this.food.fiber * this.quantity) / 100;
  }

  get calculatedSugar(): number {
    return (this.food.sugar * this.quantity) / 100;
  }

  get calculatedSodium(): number {
    return (this.food.sodium * this.quantity) / 100;
  }

  get calculatedSaturatedFat(): number {
    return ((this.food.saturatedFat || 0) * this.quantity) / 100;
  }

  get calculatedTransFat(): number {
    return ((this.food.transFat || 0) * this.quantity) / 100;
  }

  get calculatedCholesterol(): number {
    return ((this.food.cholesterol || 0) * this.quantity) / 100;
  }

  get calculatedPotassium(): number {
    return ((this.food.potassium || 0) * this.quantity) / 100;
  }

  get calculatedVitaminA(): number {
    return ((this.food.vitaminA || 0) * this.quantity) / 100;
  }

  get calculatedVitaminC(): number {
    return ((this.food.vitaminC || 0) * this.quantity) / 100;
  }

  get calculatedCalcium(): number {
    return ((this.food.calcium || 0) * this.quantity) / 100;
  }

  get calculatedIron(): number {
    return ((this.food.iron || 0) * this.quantity) / 100;
  }

  // Calculate nutrition summary for this food entry
  get nutritionSummary() {
    return {
      calories: this.calculatedCalories,
      protein: this.calculatedProtein,
      carbs: this.calculatedCarbs,
      fat: this.calculatedFat,
      fiber: this.calculatedFiber,
      sugar: this.calculatedSugar,
      sodium: this.calculatedSodium,
      saturatedFat: this.calculatedSaturatedFat,
      transFat: this.calculatedTransFat,
      cholesterol: this.calculatedCholesterol,
      potassium: this.calculatedPotassium,
      vitaminA: this.calculatedVitaminA,
      vitaminC: this.calculatedVitaminC,
      calcium: this.calculatedCalcium,
      iron: this.calculatedIron,
    };
  }
}