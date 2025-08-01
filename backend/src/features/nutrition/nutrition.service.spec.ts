import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { NutritionService } from "./nutrition.service";
import { Meal } from "../meals/entities/meal.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { fixtures } from "../../test/fixtures";

describe("NutritionService", () => {
  let service: NutritionService;
  let mealsRepository: Repository<Meal>;
  let foodEntriesRepository: Repository<FoodEntry>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockMealsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockFoodEntriesRepository = {};

  // Helper to create mock meal with calculated nutrition
  const createMockMealWithNutrition = (meal: any, foodEntries: any[]) => {
    const mockFoods = foodEntries.map((entry) => ({
      ...entry,
      calculatedCalories:
        entry.calories || (entry.food.calories * entry.quantity) / 100,
      calculatedProtein:
        entry.protein || (entry.food.protein * entry.quantity) / 100,
      calculatedCarbs:
        entry.carbs || (entry.food.carbs * entry.quantity) / 100,
      calculatedFat: entry.fat || (entry.food.fat * entry.quantity) / 100,
      food: entry.food,
    }));

    // Calculate totals for the getters
    const totalCalories = mockFoods.reduce((sum, food) => sum + food.calculatedCalories, 0);
    const totalProtein = mockFoods.reduce((sum, food) => sum + food.calculatedProtein, 0);
    const totalCarbs = mockFoods.reduce((sum, food) => sum + food.calculatedCarbs, 0);
    const totalFat = mockFoods.reduce((sum, food) => sum + food.calculatedFat, 0);
    const totalFiber = mockFoods.reduce((sum, food) => sum + (food.food.fiber * food.quantity) / 100, 0);
    const totalSugar = mockFoods.reduce((sum, food) => sum + (food.food.sugar * food.quantity) / 100, 0);
    const totalSodium = mockFoods.reduce((sum, food) => sum + (food.food.sodium * food.quantity) / 100, 0);

    return {
      ...meal,
      foods: mockFoods,
      // Mock the getters that the service uses
      get totalCalories() { return totalCalories; },
      get totalProtein() { return totalProtein; },
      get totalCarbs() { return totalCarbs; },
      get totalFat() { return totalFat; },
      get totalFiber() { return totalFiber; },
      get totalSugar() { return totalSugar; },
      get totalSodium() { return totalSodium; },
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionService,
        {
          provide: getRepositoryToken(Meal),
          useValue: mockMealsRepository,
        },
        {
          provide: getRepositoryToken(FoodEntry),
          useValue: mockFoodEntriesRepository,
        },
      ],
    }).compile();

    service = module.get<NutritionService>(NutritionService);
    mealsRepository = module.get<Repository<Meal>>(getRepositoryToken(Meal));
    foodEntriesRepository = module.get<Repository<FoodEntry>>(
      getRepositoryToken(FoodEntry),
    );
  });

  describe("getMealNutrition", () => {
    it("should calculate nutrition for a single meal", async () => {
      const mockMeal = createMockMealWithNutrition(fixtures.meals.breakfast, [
        { ...fixtures.foodEntries.breakfastApple, food: fixtures.foods.apple },
      ]);

      mockMealsRepository.findOne.mockResolvedValue(mockMeal);

<<<<<<< HEAD
      const result = await service.getMealNutrition("1", "user-1");
=======
      const result = await service.getMealNutrition("1");
>>>>>>> origin/main

      expect(result).toEqual({
        id: mockMeal.id,
        name: mockMeal.name,
        category: mockMeal.category,
        foodCount: 1,
        calories: 78,
        protein: 0.45,
        carbs: 21,
        fat: 0.3,
        fiber: 0.036,
        sugar: 0.15600000000000003,
        sodium: 0.015,
      });
    });

    it("should throw error when meal not found", async () => {
      mockMealsRepository.findOne.mockResolvedValue(null);

      await expect(service.getMealNutrition("999", "user-1")).rejects.toThrow(
        "Meal not found",
      );
    });
  });

  describe("getDailyNutrition", () => {
    it("should calculate daily nutrition summary", async () => {
      const date = "2024-01-15";
      const mockMeals = [
        createMockMealWithNutrition(fixtures.meals.breakfast, [
          {
            ...fixtures.foodEntries.breakfastApple,
            food: fixtures.foods.apple,
          },
        ]),
        createMockMealWithNutrition(fixtures.meals.lunch, [
          {
            ...fixtures.foodEntries.lunchChicken,
            food: fixtures.foods.chickenBreast,
          },
          { ...fixtures.foodEntries.lunchRice, food: fixtures.foods.brownRice },
        ]),
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockMeals);

<<<<<<< HEAD
      const result = await service.getDailyNutrition(date, "user-1");
=======
      const result = await service.getDailyNutrition(date);
>>>>>>> origin/main

      expect(result.date).toBe(date);
      expect(result.mealCount).toBe(2);
      expect(result.meals).toHaveLength(2);
      expect(result.calories).toBe(574.5); // 78 + 330 + 166.5
      expect(result.protein).toBeCloseTo(66.35, 2); // 0.45 + 62 + 3.9 - use toBeCloseTo for floating point
      expect(result.carbs).toBe(55.5); // 21 + 0 + 34.5
      expect(mockMealsRepository.createQueryBuilder).toHaveBeenCalledWith(
        "meal",
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("meal.date = :date", {
        date,
      });
    });

    it("should return empty nutrition for day with no meals", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

<<<<<<< HEAD
      const result = await service.getDailyNutrition("2024-01-15", "user-1");
=======
      const result = await service.getDailyNutrition("2024-01-15");
>>>>>>> origin/main

      expect(result.mealCount).toBe(0);
      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
    });
  });

  describe("getWeeklyNutrition", () => {
    it("should calculate weekly nutrition summary", async () => {
      const startDate = "2024-01-15";
      const start = startOfWeek(new Date(startDate));
      const end = endOfWeek(new Date(startDate));

      const mockMeals = [
        createMockMealWithNutrition(
          { ...fixtures.meals.breakfast, date: new Date("2024-01-15") },
          [
            {
              ...fixtures.foodEntries.breakfastApple,
              food: fixtures.foods.apple,
            },
          ],
        ),
        createMockMealWithNutrition(
          { ...fixtures.meals.lunch, date: new Date("2024-01-16") },
          [
            {
              ...fixtures.foodEntries.lunchChicken,
              food: fixtures.foods.chickenBreast,
            },
          ],
        ),
      ];

      mockMealsRepository.find.mockResolvedValue(mockMeals);

<<<<<<< HEAD
      const result = await service.getWeeklyNutrition(startDate, "user-1");
=======
      const result = await service.getWeeklyNutrition(startDate);
>>>>>>> origin/main

      expect(result.startDate).toBe(format(start, "yyyy-MM-dd"));
      expect(result.endDate).toBe(format(end, "yyyy-MM-dd"));
      expect(result.days).toHaveLength(7); // Full week
      expect(result.totals.calories).toBe(408); // 78 + 330
      expect(result.averages.calories).toBe(58); // 408 / 7 days
    });

    it("should handle empty week", async () => {
      mockMealsRepository.find.mockResolvedValue([]);

<<<<<<< HEAD
      const result = await service.getWeeklyNutrition("2024-01-15", "user-1");
=======
      const result = await service.getWeeklyNutrition("2024-01-15");
>>>>>>> origin/main

      expect(result.days).toHaveLength(7);
      expect(result.totals.calories).toBe(0);
      expect(result.averages.calories).toBe(0);
    });
  });

  describe("getMonthlyNutrition", () => {
    it("should get nutrition for each day of the month", async () => {
      const mockDailyNutrition = {
        date: "2024-01-01",
        meals: [],
        mealCount: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };

      jest
        .spyOn(service, "getDailyNutrition")
        .mockResolvedValue(mockDailyNutrition);

<<<<<<< HEAD
      const result = await service.getMonthlyNutrition(1, 2024, "user-1");
=======
      const result = await service.getMonthlyNutrition(1, 2024);
>>>>>>> origin/main

      expect(result).toHaveLength(31); // January has 31 days
      expect(service.getDailyNutrition).toHaveBeenCalledTimes(31);
    });
  });

  describe("compareToGoals", () => {
    it("should compare nutrition to goals", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        meals: [],
        mealCount: 1,
        calories: 1800,
        protein: 90,
        carbs: 225,
        fat: 60,
        fiber: 25,
        sugar: 40,
        sodium: 2000,
      };

      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
        fiber: 30,
        sodium: 2300,
      };

      jest
        .spyOn(service, "getDailyNutrition")
        .mockResolvedValue(mockDailyNutrition);

<<<<<<< HEAD
      const result = await service.compareToGoals("2024-01-15", goals, "user-1");
=======
      const result = await service.compareToGoals("2024-01-15", goals);
>>>>>>> origin/main

      expect(result.nutrition).toEqual(mockDailyNutrition);
      expect(result.goals).toEqual(goals);
      expect(result.percentages.calories).toBe(90); // 1800/2000 * 100
      expect(result.percentages.protein).toBe(90);
      expect(result.status.calories).toBe("met"); // 90% is within 90-110% range
      expect(result.status.protein).toBe("met");
    });

    it("should handle under goals", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        meals: [],
        mealCount: 1,
        calories: 1000,
        protein: 40,
        carbs: 100,
        fat: 30,
        fiber: 10,
        sugar: 20,
        sodium: 1000,
      };

      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      jest
        .spyOn(service, "getDailyNutrition")
        .mockResolvedValue(mockDailyNutrition);

<<<<<<< HEAD
      const result = await service.compareToGoals("2024-01-15", goals, "user-1");
=======
      const result = await service.compareToGoals("2024-01-15", goals);
>>>>>>> origin/main

      expect(result.percentages.calories).toBe(50); // 1000/2000 * 100
      expect(result.status.calories).toBe("under");
      expect(result.status.protein).toBe("under");
    });

    it("should handle over goals", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        meals: [],
        mealCount: 1,
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 80,
        fiber: 35,
        sugar: 60,
        sodium: 3000,
      };

      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      jest
        .spyOn(service, "getDailyNutrition")
        .mockResolvedValue(mockDailyNutrition);

<<<<<<< HEAD
      const result = await service.compareToGoals("2024-01-15", goals, "user-1");
=======
      const result = await service.compareToGoals("2024-01-15", goals);
>>>>>>> origin/main

      expect(result.percentages.calories).toBe(125); // 2500/2000 * 100
      expect(result.status.calories).toBe("over");
      expect(result.status.protein).toBe("over");
    });
  });

  describe("getMacroBreakdown", () => {
    it("should calculate macro breakdown percentages", () => {
      const nutrition = {
        calories: 2000,
        protein: 100, // 400 calories
        carbs: 250, // 1000 calories
        fat: 67, // 603 calories
        fiber: 25,
        sugar: 50,
        sodium: 2000,
      };

      const result = service.getMacroBreakdown(nutrition);

      expect(result.protein).toBe(20); // 400/2003 * 100 ≈ 20%
      expect(result.carbs).toBe(50); // 1000/2003 * 100 ≈ 50%
      expect(result.fat).toBe(30); // 603/2003 * 100 ≈ 30%
      expect(result.protein + result.carbs + result.fat).toBeLessThanOrEqual(
        100,
      );
    });

    it("should handle zero nutrition", () => {
      const nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };

      const result = service.getMacroBreakdown(nutrition);

      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
    });
  });

  describe("Private Methods", () => {
    it("should calculate nutrition from food entries correctly", () => {
      const foodEntries = [
        {
          ...fixtures.foodEntries.breakfastApple,
          calculatedCalories: 78,
          calculatedProtein: 0.45,
          calculatedCarbs: 21,
          calculatedFat: 0.3,
          food: fixtures.foods.apple,
          quantity: 1.5,
        },
      ];

      const result = (service as any).calculateNutritionFromFoodEntries(
        foodEntries,
      );

      expect(result.calories).toBe(78);
      expect(result.protein).toBe(0.45);
      expect(result.carbs).toBe(21);
      expect(result.fat).toBe(0.3);
      expect(result.fiber).toBe(0.036); // 2.4 * 1.5 / 100
      expect(result.sugar).toBeCloseTo(0.156, 4); // 10.4 * 1.5 / 100
      expect(result.sodium).toBe(0.015); // 1 * 1.5 / 100
    });

    it("should aggregate nutrition correctly", () => {
      const summaries = [
        {
          calories: 100,
          protein: 10,
          carbs: 20,
          fat: 5,
          fiber: 2,
          sugar: 8,
          sodium: 100,
        },
        {
          calories: 200,
          protein: 20,
          carbs: 30,
          fat: 10,
          fiber: 3,
          sugar: 12,
          sodium: 200,
        },
      ];

      const result = (service as any).aggregateNutrition(summaries);

      expect(result.calories).toBe(300);
      expect(result.protein).toBe(30);
      expect(result.carbs).toBe(50);
      expect(result.fat).toBe(15);
      expect(result.fiber).toBe(5);
      expect(result.sugar).toBe(20);
      expect(result.sodium).toBe(300);
    });

    it("should calculate averages correctly", () => {
      const totals = {
        calories: 7000,
        protein: 350,
        carbs: 875,
        fat: 233.33,
        fiber: 87.5,
        sugar: 175,
        sodium: 8050,
      };

      const result = (service as any).calculateAverages(totals, 7);

      expect(result.calories).toBe(1000);
      expect(result.protein).toBe(50);
      expect(result.carbs).toBe(125);
      expect(result.fat).toBe(33.33);
      expect(result.fiber).toBe(12.5);
      expect(result.sugar).toBe(25);
      expect(result.sodium).toBe(1150);
    });

    it("should handle zero days in averages", () => {
      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };

      const result = (service as any).calculateAverages(totals, 0);

      expect(result).toEqual(totals);
    });

    it.each([
      [85, "under"],
      [90, "met"],
      [100, "met"],
      [110, "met"],
      [115, "over"],
    ])(
      "should return %s status for %d%% of goal",
      (percentage, expectedStatus) => {
        const result = (service as any).getGoalStatus(percentage);
        expect(result).toBe(expectedStatus);
      },
    );
  });
});