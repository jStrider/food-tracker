import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Meal } from '../meals/entities/meal.entity';
import { FoodEntry } from '../foods/entities/food-entry.entity';
import { TEMP_USER_ID } from '../../common/constants/temp-user.constant';
import { startOfDay, endOfDay, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface MealSummary extends NutritionSummary {
  id: string;
  name: string;
  category: string;
  foodCount: number;
}

export interface DailyNutrition extends NutritionSummary {
  date: string;
  meals: MealSummary[];
  mealCount: number;
}

export interface WeeklyNutrition {
  startDate: string;
  endDate: string;
  days: DailyNutrition[];
  averages: NutritionSummary;
  totals: NutritionSummary;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

@Injectable()
export class NutritionService {
  constructor(
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    @InjectRepository(FoodEntry)
    private foodEntriesRepository: Repository<FoodEntry>,
  ) {}

  /**
   * Calculate nutrition for a single meal
   */
  async getMealNutrition(mealId: string): Promise<MealSummary> {
    const meal = await this.mealsRepository.findOne({
      where: { 
        id: mealId,
        userId: TEMP_USER_ID, // TODO: This should come from auth context
      },
      relations: ['foods', 'foods.food'],
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    const nutrition = this.calculateNutritionFromFoodEntries(meal.foods);

    return {
      id: meal.id,
      name: meal.name,
      category: meal.category,
      foodCount: meal.foods.length,
      ...nutrition,
    };
  }

  /**
   * Calculate daily nutrition summary
   */
  async getDailyNutrition(date: string): Promise<DailyNutrition> {
    const meals = await this.mealsRepository
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.foods', 'foods')
      .leftJoinAndSelect('foods.food', 'food')
      .where('meal.date = :date', { date })
      .andWhere('meal.userId = :userId', { userId: TEMP_USER_ID })
      .orderBy('meal.createdAt', 'ASC')
      .getMany();

    const mealSummaries: MealSummary[] = meals.map((meal) => {
      const nutrition = this.calculateNutritionFromFoodEntries(meal.foods);
      return {
        id: meal.id,
        name: meal.name,
        category: meal.category,
        foodCount: meal.foods.length,
        ...nutrition,
      };
    });

    const dailyTotals = this.aggregateNutrition(mealSummaries);

    return {
      date,
      meals: mealSummaries,
      mealCount: meals.length,
      ...dailyTotals,
    };
  }

  /**
   * Calculate weekly nutrition summary
   */
  async getWeeklyNutrition(startDate: string): Promise<WeeklyNutrition> {
    const start = startOfWeek(new Date(startDate));
    const end = endOfWeek(new Date(startDate));

    const meals = await this.mealsRepository.find({
      where: {
        date: Between(startOfDay(start), endOfDay(end)),
        userId: TEMP_USER_ID, // TODO: This should come from auth context
      },
      relations: ['foods', 'foods.food'],
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    // Group meals by date
    const mealsByDate = new Map<string, Meal[]>();
    meals.forEach((meal) => {
      const dateKey = format(meal.date, 'yyyy-MM-dd');
      if (!mealsByDate.has(dateKey)) {
        mealsByDate.set(dateKey, []);
      }
      mealsByDate.get(dateKey)!.push(meal);
    });

    // Calculate daily nutrition for each date
    const days: DailyNutrition[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const dayMeals = mealsByDate.get(dateKey) || [];
      
      const mealSummaries: MealSummary[] = dayMeals.map((meal) => {
        const nutrition = this.calculateNutritionFromFoodEntries(meal.foods);
        return {
          id: meal.id,
          name: meal.name,
          category: meal.category,
          foodCount: meal.foods.length,
          ...nutrition,
        };
      });

      const dailyTotals = this.aggregateNutrition(mealSummaries);

      days.push({
        date: dateKey,
        meals: mealSummaries,
        mealCount: dayMeals.length,
        ...dailyTotals,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeklyTotals = this.aggregateNutrition(days);
    const weeklyAverages = this.calculateAverages(weeklyTotals, days.length);

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      days,
      totals: weeklyTotals,
      averages: weeklyAverages,
    };
  }

  /**
   * Get monthly nutrition data
   */
  async getMonthlyNutrition(month: number, year: number): Promise<DailyNutrition[]> {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start, end });

    const monthlyData = await Promise.all(
      days.map(day => this.getDailyNutrition(day.toISOString().split('T')[0]))
    );

    return monthlyData;
  }

  /**
   * Compare nutrition to goals
   */
  async compareToGoals(date: string, goals: NutritionGoals): Promise<{
    nutrition: DailyNutrition;
    goals: NutritionGoals;
    percentages: Record<keyof NutritionGoals, number>;
    status: Record<keyof NutritionGoals, 'under' | 'met' | 'over'>;
  }> {
    const nutrition = await this.getDailyNutrition(date);
    
    const percentages = {
      calories: (nutrition.calories / goals.calories) * 100,
      protein: (nutrition.protein / goals.protein) * 100,
      carbs: (nutrition.carbs / goals.carbs) * 100,
      fat: (nutrition.fat / goals.fat) * 100,
      fiber: goals.fiber ? (nutrition.fiber / goals.fiber) * 100 : 0,
      sodium: goals.sodium ? (nutrition.sodium / goals.sodium) * 100 : 0,
    };

    const status = {
      calories: this.getGoalStatus(percentages.calories),
      protein: this.getGoalStatus(percentages.protein),
      carbs: this.getGoalStatus(percentages.carbs),
      fat: this.getGoalStatus(percentages.fat),
      fiber: goals.fiber ? this.getGoalStatus(percentages.fiber) : 'met' as const,
      sodium: goals.sodium ? this.getGoalStatus(percentages.sodium) : 'met' as const,
    };

    return {
      nutrition,
      goals,
      percentages,
      status,
    };
  }

  /**
   * Calculate nutrition from food entries
   */
  private calculateNutritionFromFoodEntries(foodEntries: FoodEntry[]): NutritionSummary {
    return foodEntries.reduce(
      (total, entry) => ({
        calories: total.calories + entry.calculatedCalories,
        protein: total.protein + entry.calculatedProtein,
        carbs: total.carbs + entry.calculatedCarbs,
        fat: total.fat + entry.calculatedFat,
        fiber: total.fiber + (entry.food.fiber * entry.quantity) / 100,
        sugar: total.sugar + (entry.food.sugar * entry.quantity) / 100,
        sodium: total.sodium + (entry.food.sodium * entry.quantity) / 100,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
    );
  }

  /**
   * Aggregate nutrition from multiple summaries
   */
  private aggregateNutrition(summaries: NutritionSummary[]): NutritionSummary {
    return summaries.reduce(
      (total, summary) => ({
        calories: total.calories + summary.calories,
        protein: total.protein + summary.protein,
        carbs: total.carbs + summary.carbs,
        fat: total.fat + summary.fat,
        fiber: total.fiber + summary.fiber,
        sugar: total.sugar + summary.sugar,
        sodium: total.sodium + summary.sodium,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
    );
  }

  /**
   * Calculate averages from totals
   */
  private calculateAverages(totals: NutritionSummary, days: number): NutritionSummary {
    if (days === 0) return totals;
    
    return {
      calories: Math.round(totals.calories / days),
      protein: Math.round((totals.protein / days) * 100) / 100,
      carbs: Math.round((totals.carbs / days) * 100) / 100,
      fat: Math.round((totals.fat / days) * 100) / 100,
      fiber: Math.round((totals.fiber / days) * 100) / 100,
      sugar: Math.round((totals.sugar / days) * 100) / 100,
      sodium: Math.round((totals.sodium / days) * 100) / 100,
    };
  }

  /**
   * Determine goal status
   */
  private getGoalStatus(percentage: number): 'under' | 'met' | 'over' {
    if (percentage < 90) return 'under';
    if (percentage <= 110) return 'met';
    return 'over';
  }

  /**
   * Get macronutrient breakdown as percentages
   */
  getMacroBreakdown(nutrition: NutritionSummary): {
    protein: number;
    carbs: number;
    fat: number;
  } {
    const proteinCalories = nutrition.protein * 4;
    const carbCalories = nutrition.carbs * 4;
    const fatCalories = nutrition.fat * 9;
    const totalCalories = proteinCalories + carbCalories + fatCalories;

    if (totalCalories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((proteinCalories / totalCalories) * 100),
      carbs: Math.round((carbCalories / totalCalories) * 100),
      fat: Math.round((fatCalories / totalCalories) * 100),
    };
  }
}