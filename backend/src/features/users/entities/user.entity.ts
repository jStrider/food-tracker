import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Meal } from '../../meals/entities/meal.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false }) // Exclure par défaut des requêtes pour la sécurité
  password: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ type: 'json', nullable: true })
  preferences?: {
    dailyCalorieGoal?: number;
    dailyProteinGoal?: number;
    dailyCarbGoal?: number;
    dailyFatGoal?: number;
    defaultMealCategories?: {
      breakfast: { startTime: string; endTime: string };
      lunch: { startTime: string; endTime: string };
      dinner: { startTime: string; endTime: string };
      snack: { startTime: string; endTime: string };
    };
  };

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}