import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Meal } from "../meals/entities/meal.entity";
import {
  NutritionService,
  NutritionGoals,
} from "../nutrition/nutrition.service";
import { TEMP_USER_ID } from "../../common/constants/temp-user.constant";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addDays,
  subDays,
} from "date-fns";

export interface CalendarDay {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  mealCount: number;
  hasData: boolean;
  isCurrentMonth?: boolean;
  dayOfWeek: number;
  goalProgress?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals?: {
    id: string;
    name: string;
    category: string;
    time?: string;
    calories: number;
  }[];
}

export interface MonthData {
  month: number;
  year: number;
  days: CalendarDay[];
  summary: {
    totalDays: number;
    daysWithData: number;
    averageCalories: number;
    totalCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
  };
}

export interface WeekData {
  startDate: string;
  endDate: string;
  days: CalendarDay[];
  summary: {
    totalCalories: number;
    averageCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    daysWithData: number;
  };
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    private nutritionService: NutritionService,
  ) {}

  async getMonthView(
    month: number,
    year: number,
    goals?: NutritionGoals,
  ): Promise<MonthData> {
    try {
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Get all meals for the month
      // TODO: Add proper user context from authentication
      const meals = await this.mealsRepository.find({
        where: {
          date: Between(startDate, endDate),
          userId: TEMP_USER_ID, // TODO: This should come from auth context
        },
        relations: ["foods", "foods.food"],
        order: { date: "ASC" },
      });

      // Group meals by date
      const mealsByDate = new Map<string, Meal[]>();
      meals.forEach((meal) => {
        const dateKey = format(new Date(meal.date), "yyyy-MM-dd");
        if (!mealsByDate.has(dateKey)) {
          mealsByDate.set(dateKey, []);
        }
        mealsByDate.get(dateKey)!.push(meal);
      });

      // Generate all days in the month
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const calendarDays: CalendarDay[] = [];

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let daysWithData = 0;

      for (const day of allDays) {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayMeals = mealsByDate.get(dateKey) || [];

        let dayNutrition = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        };

        if (dayMeals.length > 0) {
          const dayData =
            await this.nutritionService.getDailyNutrition(dateKey);
          dayNutrition = {
            calories: dayData.calories,
            protein: dayData.protein,
            carbs: dayData.carbs,
            fat: dayData.fat,
            fiber: dayData.fiber,
          };

          totalCalories += dayNutrition.calories;
          totalProtein += dayNutrition.protein;
          totalCarbs += dayNutrition.carbs;
          totalFat += dayNutrition.fat;
          daysWithData++;
        }

        const calendarDay: CalendarDay = {
          date: dateKey,
          totalCalories: Math.round(dayNutrition.calories),
          totalProtein: Math.round(dayNutrition.protein * 10) / 10,
          totalCarbs: Math.round(dayNutrition.carbs * 10) / 10,
          totalFat: Math.round(dayNutrition.fat * 10) / 10,
          totalFiber: Math.round(dayNutrition.fiber * 10) / 10,
          mealCount: dayMeals.length,
          hasData: dayMeals.length > 0,
          isCurrentMonth: isSameMonth(day, new Date(year, month - 1)),
          dayOfWeek: day.getDay(),
          meals: dayMeals.map((meal) => ({
            id: meal.id,
            name: meal.name,
            category: meal.category,
            time: meal.time,
            calories: meal.totalCalories,
          })),
        };

        // Add goal progress if goals are provided
        if (goals && dayMeals.length > 0) {
          calendarDay.goalProgress = {
            calories: Math.round(
              (dayNutrition.calories / goals.calories) * 100,
            ),
            protein: Math.round((dayNutrition.protein / goals.protein) * 100),
            carbs: Math.round((dayNutrition.carbs / goals.carbs) * 100),
            fat: Math.round((dayNutrition.fat / goals.fat) * 100),
          };
        }

        calendarDays.push(calendarDay);
      }

      return {
        month,
        year,
        days: calendarDays,
        summary: {
          totalDays: allDays.length,
          daysWithData,
          averageCalories:
            daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
          totalCalories: Math.round(totalCalories),
          averageProtein:
            daysWithData > 0
              ? Math.round((totalProtein / daysWithData) * 10) / 10
              : 0,
          averageCarbs:
            daysWithData > 0
              ? Math.round((totalCarbs / daysWithData) * 10) / 10
              : 0,
          averageFat:
            daysWithData > 0
              ? Math.round((totalFat / daysWithData) * 10) / 10
              : 0,
        },
      };
    } catch (error) {
      this.logger.error("Error in getMonthView:", error.stack);
      // Return empty calendar data to prevent 500 error
      return {
        month,
        year,
        days: [],
        summary: {
          totalDays: new Date(year, month, 0).getDate(),
          daysWithData: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0,
        },
      };
    }
  }

  async getWeekView(
    startDate: string,
    goals?: NutritionGoals,
  ): Promise<WeekData> {
    const start = startOfWeek(new Date(startDate));
    const end = endOfWeek(new Date(startDate));

    // Fetch meals for the week to include meal details
    const meals = await this.mealsRepository.find({
      where: {
        date: Between(start, end),
        userId: TEMP_USER_ID, // TODO: This should come from auth context
      },
      relations: ["foods", "foods.food"],
      order: { date: "ASC", time: "ASC" },
    });

    // Group meals by date
    const mealsByDate = new Map<string, Meal[]>();
    meals.forEach((meal) => {
      const dateKey = format(new Date(meal.date), "yyyy-MM-dd");
      if (!mealsByDate.has(dateKey)) {
        mealsByDate.set(dateKey, []);
      }
      mealsByDate.get(dateKey)!.push(meal);
    });

    const weeklyNutrition = await this.nutritionService.getWeeklyNutrition(
      format(start, "yyyy-MM-dd"),
    );

    const calendarDays: CalendarDay[] = weeklyNutrition.days.map((day) => {
      const dayMeals = mealsByDate.get(day.date) || [];

      const calendarDay: CalendarDay = {
        date: day.date,
        totalCalories: Math.round(day.calories),
        totalProtein: Math.round(day.protein * 10) / 10,
        totalCarbs: Math.round(day.carbs * 10) / 10,
        totalFat: Math.round(day.fat * 10) / 10,
        totalFiber: Math.round(day.fiber * 10) / 10,
        mealCount: day.mealCount,
        hasData: day.mealCount > 0,
        dayOfWeek: new Date(day.date).getDay(),
        meals: dayMeals.map((meal) => ({
          id: meal.id,
          name: meal.name,
          category: meal.category,
          time: meal.time,
          calories: meal.totalCalories,
        })),
      };

      // Add goal progress if goals are provided
      if (goals && day.mealCount > 0) {
        calendarDay.goalProgress = {
          calories: Math.round((day.calories / goals.calories) * 100),
          protein: Math.round((day.protein / goals.protein) * 100),
          carbs: Math.round((day.carbs / goals.carbs) * 100),
          fat: Math.round((day.fat / goals.fat) * 100),
        };
      }

      return calendarDay;
    });

    const daysWithData = calendarDays.filter((day) => day.hasData).length;

    return {
      startDate: weeklyNutrition.startDate,
      endDate: weeklyNutrition.endDate,
      days: calendarDays,
      summary: {
        totalCalories: Math.round(weeklyNutrition.totals.calories),
        averageCalories: Math.round(weeklyNutrition.averages.calories),
        totalProtein: Math.round(weeklyNutrition.totals.protein * 10) / 10,
        totalCarbs: Math.round(weeklyNutrition.totals.carbs * 10) / 10,
        totalFat: Math.round(weeklyNutrition.totals.fat * 10) / 10,
        daysWithData,
      },
    };
  }

  async getDayView(date: string) {
    return this.nutritionService.getDailyNutrition(date);
  }

  /**
   * Get nutrition streaks (consecutive days with data)
   */
  async getNutritionStreaks(endDate?: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakDates: string[];
  }> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = subDays(end, 90); // Look back 90 days

    const meals = await this.mealsRepository.find({
      where: {
        date: Between(start, end),
        userId: TEMP_USER_ID, // TODO: This should come from auth context
      },
      select: ["date"],
      order: { date: "ASC" },
    });

    // Get unique dates with meals
    const datesWithMeals = new Set(
      meals.map((meal) => format(meal.date, "yyyy-MM-dd")),
    );

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const streakDates: string[] = [];

    // Check from end date backwards for current streak
    const currentDate = new Date(end);
    while (currentDate >= start) {
      const dateKey = format(currentDate, "yyyy-MM-dd");
      if (datesWithMeals.has(dateKey)) {
        currentStreak++;
        streakDates.unshift(dateKey);
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Find longest streak in the period
    const allDays = eachDayOfInterval({ start, end });
    for (const day of allDays) {
      const dateKey = format(day, "yyyy-MM-dd");
      if (datesWithMeals.has(dateKey)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      streakDates,
    };
  }

  /**
   * Get calendar stats for a date range
   */
  async getCalendarStats(
    startDate: string,
    endDate: string,
  ): Promise<{
    totalDays: number;
    daysWithData: number;
    completionRate: number;
    averageCalories: number;
    averageMealsPerDay: number;
    mostActiveDay: string;
    leastActiveDay: string;
  }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const meals = await this.mealsRepository.find({
      where: {
        date: Between(start, end),
        userId: TEMP_USER_ID, // TODO: This should come from auth context
      },
      relations: ["foods", "foods.food"],
      order: { date: "ASC" },
    });

    // Group by date
    const mealsByDate = new Map<string, Meal[]>();
    let totalCalories = 0;
    let totalMeals = 0;

    for (const meal of meals) {
      const dateKey = format(new Date(meal.date), "yyyy-MM-dd");
      if (!mealsByDate.has(dateKey)) {
        mealsByDate.set(dateKey, []);
      }
      mealsByDate.get(dateKey)!.push(meal);

      // Calculate calories for this meal
      const mealCalories = meal.foods.reduce((sum, entry) => {
        return sum + entry.calculatedCalories;
      }, 0);
      totalCalories += mealCalories;
      totalMeals++;
    }

    const allDays = eachDayOfInterval({ start, end });
    const totalDays = allDays.length;
    const daysWithData = mealsByDate.size;
    const completionRate = Math.round((daysWithData / totalDays) * 100);

    // Find most and least active days
    let mostActiveDay = "";
    let leastActiveDay = "";
    let maxMeals = 0;
    let minMeals = Infinity;

    for (const [date, dayMeals] of mealsByDate) {
      if (dayMeals.length > maxMeals) {
        maxMeals = dayMeals.length;
        mostActiveDay = date;
      }
      if (dayMeals.length < minMeals) {
        minMeals = dayMeals.length;
        leastActiveDay = date;
      }
    }

    return {
      totalDays,
      daysWithData,
      completionRate,
      averageCalories:
        daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
      averageMealsPerDay:
        daysWithData > 0
          ? Math.round((totalMeals / daysWithData) * 10) / 10
          : 0,
      mostActiveDay,
      leastActiveDay,
    };
  }
}
