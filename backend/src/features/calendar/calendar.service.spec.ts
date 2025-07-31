import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { CalendarService } from "./calendar.service";
import { Meal } from "../meals/entities/meal.entity";
import { NutritionService } from "../nutrition/nutrition.service";
import { fixtures } from "../../test/fixtures";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { TEMP_USER_ID } from "../../common/constants/temp-user.constant";

describe("CalendarService", () => {
  let service: CalendarService;
  let mealsRepository: Repository<Meal>;
  let nutritionService: NutritionService;

  const mockMealsRepository = {
    find: jest.fn(),
  };

  const mockNutritionService = {
    getDailyNutrition: jest.fn(),
    getWeeklyNutrition: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getRepositoryToken(Meal),
          useValue: mockMealsRepository,
        },
        {
          provide: NutritionService,
          useValue: mockNutritionService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    mealsRepository = module.get<Repository<Meal>>(getRepositoryToken(Meal));
    nutritionService = module.get<NutritionService>(NutritionService);

    // Mock the logger to prevent error logs in tests
    (service as any).logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
  });

  describe("getMonthView", () => {
    it("should return month view with nutrition data", async () => {
      const month = 1;
      const year = 2024;
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      const mockMeals = [
        {
          ...fixtures.meals.breakfast,
          date: new Date("2024-01-15"),
          foods: [],
        },
        { ...fixtures.meals.lunch, date: new Date("2024-01-15"), foods: [] },
        { ...fixtures.meals.dinner, date: new Date("2024-01-16"), foods: [] },
      ];

      mockMealsRepository.find.mockResolvedValue(mockMeals);
      mockNutritionService.getDailyNutrition
        .mockResolvedValueOnce({
          date: "2024-01-15",
          calories: 1500,
          protein: 75,
          carbs: 200,
          fat: 50,
          fiber: 25,
          mealCount: 2,
        })
        .mockResolvedValueOnce({
          date: "2024-01-16",
          calories: 1200,
          protein: 60,
          carbs: 150,
          fat: 40,
          fiber: 20,
          mealCount: 1,
        });

      const result = await service.getMonthView(month, year);

      expect(result.month).toBe(month);
      expect(result.year).toBe(year);
      expect(result.days).toHaveLength(31); // January has 31 days
      expect(result.summary.daysWithData).toBe(2);
      expect(result.summary.totalCalories).toBe(2700);
      expect(result.summary.averageCalories).toBe(1350);
      expect(mockMealsRepository.find).toHaveBeenCalledWith({
        where: {
          date: Between(startDate, endDate),
          userId: TEMP_USER_ID,
        },
        relations: ["foods", "foods.food"],
        order: { date: "ASC" },
      });
    });

    it("should include goal progress when goals provided", async () => {
      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const mockMeals = [
        {
          ...fixtures.meals.breakfast,
          date: new Date("2024-01-15"),
          foods: [],
        },
      ];

      mockMealsRepository.find.mockResolvedValue(mockMeals);
      mockNutritionService.getDailyNutrition.mockResolvedValue({
        date: "2024-01-15",
        calories: 1800,
        protein: 90,
        carbs: 225,
        fat: 60,
        fiber: 25,
        mealCount: 1,
      });

      const result = await service.getMonthView(1, 2024, goals);

      const dayWithData = result.days.find((day) => day.date === "2024-01-15");
      expect(dayWithData.goalProgress).toBeDefined();
      expect(dayWithData.goalProgress.calories).toBe(90); // 1800/2000 * 100
      expect(dayWithData.goalProgress.protein).toBe(90);
      expect(dayWithData.goalProgress.carbs).toBe(90);
      expect(dayWithData.goalProgress.fat).toBe(92);
    });

    it("should handle empty month", async () => {
      mockMealsRepository.find.mockResolvedValue([]);

      const result = await service.getMonthView(1, 2024);

      expect(result.days).toHaveLength(31);
      expect(result.summary.daysWithData).toBe(0);
      expect(result.summary.totalCalories).toBe(0);
      expect(result.summary.averageCalories).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      mockMealsRepository.find.mockRejectedValue(new Error("Database error"));

      const result = await service.getMonthView(1, 2024);

      expect(result.month).toBe(1);
      expect(result.year).toBe(2024);
      expect(result.days).toEqual([]);
      expect(result.summary.daysWithData).toBe(0);
    });
  });

  describe("getWeekView", () => {
    it("should return week view with nutrition data", async () => {
      const startDate = "2024-01-15";
      const mockWeeklyNutrition = {
        startDate: "2024-01-14",
        endDate: "2024-01-20",
        days: [
          {
            date: "2024-01-14",
            calories: 1800,
            protein: 90,
            carbs: 225,
            fat: 60,
            fiber: 25,
            sugar: 40,
            sodium: 2000,
            mealCount: 3,
            meals: [],
          },
          {
            date: "2024-01-15",
            calories: 2000,
            protein: 100,
            carbs: 250,
            fat: 65,
            fiber: 30,
            sugar: 50,
            sodium: 2300,
            mealCount: 4,
            meals: [],
          },
        ],
        totals: {
          calories: 3800,
          protein: 190,
          carbs: 475,
          fat: 125,
          fiber: 55,
          sugar: 90,
          sodium: 4300,
        },
        averages: {
          calories: 1900,
          protein: 95,
          carbs: 237.5,
          fat: 62.5,
          fiber: 27.5,
          sugar: 45,
          sodium: 2150,
        },
      };

      mockNutritionService.getWeeklyNutrition.mockResolvedValue(
        mockWeeklyNutrition,
      );
      mockMealsRepository.find.mockResolvedValue([]);

      const result = await service.getWeekView(startDate);

      expect(result.startDate).toBe("2024-01-14");
      expect(result.endDate).toBe("2024-01-20");
      expect(result.days).toHaveLength(2); // Only days with data from mock
      expect(result.summary.totalCalories).toBe(3800);
      expect(result.summary.averageCalories).toBe(1900);
      expect(result.summary.daysWithData).toBe(2);
    });

    it("should include goal progress when goals provided", async () => {
      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const mockWeeklyNutrition = {
        startDate: "2024-01-14",
        endDate: "2024-01-20",
        days: [
          {
            date: "2024-01-15",
            calories: 1800,
            protein: 90,
            carbs: 225,
            fat: 60,
            fiber: 25,
            sugar: 40,
            sodium: 2000,
            mealCount: 3,
            meals: [],
          },
        ],
        totals: {
          calories: 1800,
          protein: 90,
          carbs: 225,
          fat: 60,
          fiber: 25,
          sugar: 40,
          sodium: 2000,
        },
        averages: {
          calories: 1800,
          protein: 90,
          carbs: 225,
          fat: 60,
          fiber: 25,
          sugar: 40,
          sodium: 2000,
        },
      };

      mockNutritionService.getWeeklyNutrition.mockResolvedValue(
        mockWeeklyNutrition,
      );
      mockMealsRepository.find.mockResolvedValue([]);

      const result = await service.getWeekView("2024-01-15", goals);

      const dayWithData = result.days[0];
      expect(dayWithData.goalProgress).toBeDefined();
      expect(dayWithData.goalProgress.calories).toBe(90);
      expect(dayWithData.goalProgress.protein).toBe(90);
    });
  });

  describe("getDayView", () => {
    it("should return daily nutrition data", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        calories: 1800,
        protein: 90,
        carbs: 225,
        fat: 60,
        fiber: 25,
        sugar: 40,
        sodium: 2000,
        mealCount: 3,
        meals: [],
      };

      mockNutritionService.getDailyNutrition.mockResolvedValue(
        mockDailyNutrition,
      );

      const result = await service.getDayView("2024-01-15");

      expect(result).toEqual(mockDailyNutrition);
      expect(nutritionService.getDailyNutrition).toHaveBeenCalledWith(
        "2024-01-15",
      );
    });
  });

  describe("getNutritionStreaks", () => {
    it("should calculate nutrition streaks correctly", async () => {
      const endDate = "2024-01-20";
      const mockMeals = [
        { date: new Date("2024-01-18") },
        { date: new Date("2024-01-19") },
        { date: new Date("2024-01-20") },
        // Gap
        { date: new Date("2024-01-10") },
        { date: new Date("2024-01-11") },
        { date: new Date("2024-01-12") },
        { date: new Date("2024-01-13") },
        { date: new Date("2024-01-14") },
      ];

      mockMealsRepository.find.mockResolvedValue(mockMeals);

      const result = await service.getNutritionStreaks(endDate);

      expect(result.currentStreak).toBe(3); // Last 3 consecutive days
      expect(result.longestStreak).toBe(5); // Days 10-14
      expect(result.streakDates).toEqual([
        "2024-01-18",
        "2024-01-19",
        "2024-01-20",
      ]);
    });

    it("should handle no streak", async () => {
      mockMealsRepository.find.mockResolvedValue([]);

      const result = await service.getNutritionStreaks("2024-01-20");

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.streakDates).toEqual([]);
    });

    it("should use current date when endDate not provided", async () => {
      mockMealsRepository.find.mockResolvedValue([]);

      await service.getNutritionStreaks();

      expect(mockMealsRepository.find).toHaveBeenCalled();
      // Verify date range is reasonable (90 days back from today)
      const callArgs = mockMealsRepository.find.mock.calls[0][0];
      expect(callArgs.where.date).toBeDefined();
    });
  });

  describe("getCalendarStats", () => {
    it("should calculate calendar statistics", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";

      const mockMeals = [
        {
          ...fixtures.meals.breakfast,
          date: new Date("2024-01-15"),
          foods: [
            {
              calculatedCalories: 300,
              calculatedProtein: 20,
              calculatedCarbs: 40,
              calculatedFat: 10,
            },
          ],
        },
        {
          ...fixtures.meals.lunch,
          date: new Date("2024-01-15"),
          foods: [
            {
              calculatedCalories: 500,
              calculatedProtein: 30,
              calculatedCarbs: 60,
              calculatedFat: 15,
            },
          ],
        },
        {
          ...fixtures.meals.dinner,
          date: new Date("2024-01-16"),
          foods: [
            {
              calculatedCalories: 600,
              calculatedProtein: 40,
              calculatedCarbs: 70,
              calculatedFat: 20,
            },
          ],
        },
      ];

      mockMealsRepository.find.mockResolvedValue(mockMeals);

      const result = await service.getCalendarStats(startDate, endDate);

      expect(result.totalDays).toBe(31); // January has 31 days
      expect(result.daysWithData).toBe(2); // 2 unique days with meals
      expect(result.completionRate).toBe(6); // 2/31 * 100 ≈ 6%
      expect(result.averageCalories).toBe(700); // (800 + 600) / 2
      expect(result.averageMealsPerDay).toBe(1.5); // 3 meals / 2 days
      expect(result.mostActiveDay).toBe("2024-01-15"); // 2 meals
      expect(result.leastActiveDay).toBe("2024-01-16"); // 1 meal
    });

    it("should handle empty date range", async () => {
      mockMealsRepository.find.mockResolvedValue([]);

      const result = await service.getCalendarStats(
        "2024-01-01",
        "2024-01-31",
      );

      expect(result.totalDays).toBe(31);
      expect(result.daysWithData).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageCalories).toBe(0);
      expect(result.averageMealsPerDay).toBe(0);
      expect(result.mostActiveDay).toBe("");
      expect(result.leastActiveDay).toBe("");
    });
  });
});
