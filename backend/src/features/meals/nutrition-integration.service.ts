import { Injectable, Logger } from "@nestjs/common";
import { MealsService, DailyNutritionSummary } from "./meals.service";
import { Meal } from "./entities/meal.entity";

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface NutritionProgress {
  goals: NutritionGoals;
  actual: DailyNutritionSummary;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  status: {
    calories: "under" | "met" | "over";
    protein: "under" | "met" | "over";
    carbs: "under" | "met" | "over";
    fat: "under" | "met" | "over";
  };
}

export interface MacroDistribution {
  protein: { grams: number; percentage: number; calories: number };
  carbs: { grams: number; percentage: number; calories: number };
  fat: { grams: number; percentage: number; calories: number };
  totalCalories: number;
}

@Injectable()
export class NutritionIntegrationService {
  private readonly logger = new Logger(NutritionIntegrationService.name);

  constructor(private readonly mealsService: MealsService) {}

  /**
   * Calculate nutrition progress against goals
   */
  async calculateNutritionProgress(
    date: string,
    goals: NutritionGoals,
  ): Promise<NutritionProgress> {
    this.logger.log(`Calculating nutrition progress for ${date}`);

    const actual = await this.mealsService.getDailyNutrition(date);

    // Calculate percentages
    const percentages: any = {
      calories: this.calculatePercentage(actual.totalCalories, goals.calories),
      protein: this.calculatePercentage(actual.totalProtein, goals.protein),
      carbs: this.calculatePercentage(actual.totalCarbs, goals.carbs),
      fat: this.calculatePercentage(actual.totalFat, goals.fat),
    };

    if (goals.fiber !== undefined) {
      percentages.fiber = this.calculatePercentage(
        actual.totalFiber,
        goals.fiber,
      );
    }

    if (goals.sugar !== undefined) {
      percentages.sugar = this.calculatePercentage(
        actual.totalSugar,
        goals.sugar,
      );
    }

    if (goals.sodium !== undefined) {
      percentages.sodium = this.calculatePercentage(
        actual.totalSodium,
        goals.sodium,
      );
    }

    // Determine status (with 5% tolerance for "met")
    const status = {
      calories: this.getStatus(percentages.calories),
      protein: this.getStatus(percentages.protein),
      carbs: this.getStatus(percentages.carbs),
      fat: this.getStatus(percentages.fat),
    };

    return {
      goals,
      actual,
      percentages,
      status,
    };
  }

  /**
   * Calculate macro distribution for a meal or day
   */
  calculateMacroDistribution(
    totalCalories: number,
    totalProtein: number,
    totalCarbs: number,
    totalFat: number,
  ): MacroDistribution {
    // Calories per gram: protein=4, carbs=4, fat=9
    const proteinCalories = totalProtein * 4;
    const carbsCalories = totalCarbs * 4;
    const fatCalories = totalFat * 9;

    const calculatedCalories = proteinCalories + carbsCalories + fatCalories;
    const actualCalories = totalCalories || calculatedCalories;

    return {
      protein: {
        grams: Math.round(totalProtein * 100) / 100,
        percentage: Math.round((proteinCalories / actualCalories) * 100),
        calories: Math.round(proteinCalories),
      },
      carbs: {
        grams: Math.round(totalCarbs * 100) / 100,
        percentage: Math.round((carbsCalories / actualCalories) * 100),
        calories: Math.round(carbsCalories),
      },
      fat: {
        grams: Math.round(totalFat * 100) / 100,
        percentage: Math.round((fatCalories / actualCalories) * 100),
        calories: Math.round(fatCalories),
      },
      totalCalories: Math.round(actualCalories),
    };
  }

  /**
   * Get macro distribution for a specific day
   */
  async getDailyMacroDistribution(date: string): Promise<MacroDistribution> {
    const nutrition = await this.mealsService.getDailyNutrition(date);

    return this.calculateMacroDistribution(
      nutrition.totalCalories,
      nutrition.totalProtein,
      nutrition.totalCarbs,
      nutrition.totalFat,
    );
  }

  /**
   * Get macro distribution for a specific meal
   */
  async getMealMacroDistribution(mealId: string): Promise<MacroDistribution> {
    const meal = await this.mealsService.findOne(mealId, true);

    return this.calculateMacroDistribution(
      meal.totalCalories,
      meal.totalProtein,
      meal.totalCarbs,
      meal.totalFat,
    );
  }

  /**
   * Calculate nutrition trends over a date range
   */
  async calculateNutritionTrends(
    startDate: string,
    endDate: string,
  ): Promise<{
    averages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
    dailyData: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      macroDistribution: MacroDistribution;
    }>;
    totalDays: number;
  }> {
    this.logger.log(
      `Calculating nutrition trends from ${startDate} to ${endDate}`,
    );

    const meals = await this.mealsService.findByDateRange(
      startDate,
      endDate,
      true,
    );

    // Group meals by date
    const mealsByDate = meals.reduce(
      (acc, meal) => {
        const dateStr = meal.date.toISOString().split("T")[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(meal);
        return acc;
      },
      {} as Record<string, Meal[]>,
    );

    const dailyData = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    for (const [date, dateMeals] of Object.entries(mealsByDate)) {
      const dayCalories = dateMeals.reduce(
        (sum, meal) => sum + meal.totalCalories,
        0,
      );
      const dayProtein = dateMeals.reduce(
        (sum, meal) => sum + meal.totalProtein,
        0,
      );
      const dayCarbs = dateMeals.reduce(
        (sum, meal) => sum + meal.totalCarbs,
        0,
      );
      const dayFat = dateMeals.reduce((sum, meal) => sum + meal.totalFat, 0);

      totalCalories += dayCalories;
      totalProtein += dayProtein;
      totalCarbs += dayCarbs;
      totalFat += dayFat;
      totalFiber += dateMeals.reduce((sum, meal) => sum + meal.totalFiber, 0);
      totalSugar += dateMeals.reduce((sum, meal) => sum + meal.totalSugar, 0);
      totalSodium += dateMeals.reduce((sum, meal) => sum + meal.totalSodium, 0);

      dailyData.push({
        date,
        calories: Math.round(dayCalories),
        protein: Math.round(dayProtein * 100) / 100,
        carbs: Math.round(dayCarbs * 100) / 100,
        fat: Math.round(dayFat * 100) / 100,
        macroDistribution: this.calculateMacroDistribution(
          dayCalories,
          dayProtein,
          dayCarbs,
          dayFat,
        ),
      });
    }

    const totalDays = Object.keys(mealsByDate).length;

    return {
      averages: {
        calories: totalDays > 0 ? Math.round(totalCalories / totalDays) : 0,
        protein:
          totalDays > 0
            ? Math.round((totalProtein / totalDays) * 100) / 100
            : 0,
        carbs:
          totalDays > 0 ? Math.round((totalCarbs / totalDays) * 100) / 100 : 0,
        fat: totalDays > 0 ? Math.round((totalFat / totalDays) * 100) / 100 : 0,
        fiber:
          totalDays > 0 ? Math.round((totalFiber / totalDays) * 100) / 100 : 0,
        sugar:
          totalDays > 0 ? Math.round((totalSugar / totalDays) * 100) / 100 : 0,
        sodium:
          totalDays > 0 ? Math.round((totalSodium / totalDays) * 100) / 100 : 0,
      },
      dailyData: dailyData.sort((a, b) => a.date.localeCompare(b.date)),
      totalDays,
    };
  }

  /**
   * Suggest meal timing optimization based on nutrition distribution
   */
  async suggestMealOptimization(date: string): Promise<{
    currentDistribution: Array<{
      mealName: string;
      category: string;
      time?: string;
      calories: number;
      percentage: number;
    }>;
    recommendations: string[];
  }> {
    const meals = await this.mealsService.findByDate({
      date,
      includeFoods: true,
    });

    if (meals.length === 0) {
      return {
        currentDistribution: [],
        recommendations: ["No meals found for this date"],
      };
    }

    const totalCalories = meals.reduce(
      (sum, meal) => sum + meal.totalCalories,
      0,
    );

    const currentDistribution = meals.map((meal) => ({
      mealName: meal.name,
      category: meal.category,
      time: meal.time,
      calories: Math.round(meal.totalCalories),
      percentage: Math.round((meal.totalCalories / totalCalories) * 100),
    }));

    const recommendations =
      this.generateMealRecommendations(currentDistribution);

    return {
      currentDistribution,
      recommendations,
    };
  }

  /**
   * Calculate percentage with rounding
   */
  private calculatePercentage(actual: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.round((actual / goal) * 100);
  }

  /**
   * Determine goal status with tolerance
   */
  private getStatus(percentage: number): "under" | "met" | "over" {
    if (percentage < 95) return "under";
    if (percentage > 110) return "over";
    return "met";
  }

  /**
   * Generate meal optimization recommendations
   */
  private generateMealRecommendations(
    distribution: Array<{
      mealName: string;
      category: string;
      calories: number;
      percentage: number;
    }>,
  ): string[] {
    const recommendations = [];

    // Check breakfast
    const breakfast = distribution.filter((m) => m.category === "breakfast");
    const breakfastCalories = breakfast.reduce(
      (sum, m) => sum + m.percentage,
      0,
    );

    if (breakfastCalories < 20) {
      recommendations.push(
        "Consider increasing breakfast calories to 20-25% of daily intake for better energy distribution",
      );
    } else if (breakfastCalories > 35) {
      recommendations.push(
        "Breakfast is quite large; consider redistributing some calories to other meals",
      );
    }

    // Check dinner timing and size
    const dinner = distribution.filter((m) => m.category === "dinner");
    const dinnerCalories = dinner.reduce((sum, m) => sum + m.percentage, 0);

    if (dinnerCalories > 40) {
      recommendations.push(
        "Dinner represents a large portion of daily calories; consider having a lighter dinner and larger lunch",
      );
    }

    // Check meal frequency
    if (distribution.length < 3) {
      recommendations.push(
        "Consider adding more meals throughout the day for better nutrient distribution",
      );
    } else if (distribution.length > 6) {
      recommendations.push(
        "You have many small meals; this can be good for metabolism if it works for your schedule",
      );
    }

    // Check snack balance
    const snacks = distribution.filter((m) => m.category === "snack");
    const snackCalories = snacks.reduce((sum, m) => sum + m.percentage, 0);

    if (snackCalories > 25) {
      recommendations.push(
        "Snacks represent a significant portion of daily calories; consider incorporating them into main meals",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Your meal distribution looks well balanced!");
    }

    return recommendations;
  }
}
