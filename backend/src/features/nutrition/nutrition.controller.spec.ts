import { Test, TestingModule } from "@nestjs/testing";
import { NutritionController } from "./nutrition.controller";
import { NutritionService } from "./nutrition.service";

describe("NutritionController", () => {
  let controller: NutritionController;
  let nutritionService: NutritionService;

  const mockNutritionService = {
    getDailyNutrition: jest.fn(),
    getWeeklyNutrition: jest.fn(),
    getMonthlyNutrition: jest.fn(),
    getMealNutrition: jest.fn(),
    compareToGoals: jest.fn(),
    getMacroBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NutritionController],
      providers: [
        {
          provide: NutritionService,
          useValue: mockNutritionService,
        },
      ],
    }).compile();

    controller = module.get<NutritionController>(NutritionController);
    nutritionService = module.get<NutritionService>(NutritionService);
  });

  describe("getDailyNutrition", () => {
    it("should return daily nutrition summary", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        meals: [],
        mealCount: 2,
        calories: 1800,
        protein: 90,
        carbs: 225,
        fat: 60,
        fiber: 25,
        sugar: 40,
        sodium: 2000,
      };

      mockNutritionService.getDailyNutrition.mockResolvedValue(
        mockDailyNutrition,
      );

      const result = await controller.getDailyNutrition("2024-01-15");

      expect(result).toEqual(mockDailyNutrition);
      expect(nutritionService.getDailyNutrition).toHaveBeenCalledWith(
        "2024-01-15",
      );
    });
  });

  describe("getWeeklyNutrition", () => {
    it("should return weekly nutrition summary", async () => {
      const mockWeeklyNutrition = {
        startDate: "2024-01-14",
        endDate: "2024-01-20",
        days: [],
        totals: {
          calories: 12600,
          protein: 630,
          carbs: 1575,
          fat: 420,
          fiber: 175,
          sugar: 280,
          sodium: 14000,
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

      const result = await controller.getWeeklyNutrition("2024-01-15");

      expect(result).toEqual(mockWeeklyNutrition);
      expect(nutritionService.getWeeklyNutrition).toHaveBeenCalledWith(
        "2024-01-15",
      );
    });
  });

  describe("getMonthlyNutrition", () => {
    it("should return monthly nutrition data", async () => {
      const mockMonthlyData = [
        {
          date: "2024-01-01",
          meals: [],
          mealCount: 3,
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 65,
          fiber: 30,
          sugar: 50,
          sodium: 2300,
        },
      ];

      mockNutritionService.getMonthlyNutrition.mockResolvedValue(
        mockMonthlyData,
      );

      const result = await controller.getMonthlyNutrition("1", "2024");

      expect(result).toEqual(mockMonthlyData);
      expect(nutritionService.getMonthlyNutrition).toHaveBeenCalledWith(
        1,
        2024,
      );
    });

    it("should parse string parameters to numbers", async () => {
      mockNutritionService.getMonthlyNutrition.mockResolvedValue([]);

      await controller.getMonthlyNutrition("12", "2023");

      expect(nutritionService.getMonthlyNutrition).toHaveBeenCalledWith(
        12,
        2023,
      );
    });
  });

  describe("getMealNutrition", () => {
    it("should return nutrition for a specific meal", async () => {
      const mockMealNutrition = {
        id: "1",
        name: "Breakfast",
        category: "breakfast",
        foodCount: 2,
        calories: 400,
        protein: 20,
        carbs: 50,
        fat: 15,
        fiber: 8,
        sugar: 20,
        sodium: 400,
      };

      mockNutritionService.getMealNutrition.mockResolvedValue(
        mockMealNutrition,
      );

      const result = await controller.getMealNutrition("1");

      expect(result).toEqual(mockMealNutrition);
      expect(nutritionService.getMealNutrition).toHaveBeenCalledWith("1");
    });
  });

  describe("compareToGoals", () => {
    it("should compare daily nutrition to goals", async () => {
      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
        fiber: 30,
        sodium: 2300,
      };

      const mockComparison = {
        nutrition: {
          date: "2024-01-15",
          meals: [],
          mealCount: 3,
          calories: 1800,
          protein: 90,
          carbs: 225,
          fat: 60,
          fiber: 25,
          sugar: 40,
          sodium: 2000,
        },
        goals,
        percentages: {
          calories: 90,
          protein: 90,
          carbs: 90,
          fat: 92.3,
          fiber: 83.3,
          sodium: 87,
        },
        status: {
          calories: "met",
          protein: "met",
          carbs: "met",
          fat: "met",
          fiber: "under",
          sodium: "under",
        },
      };

      mockNutritionService.compareToGoals.mockResolvedValue(mockComparison);

      const result = await controller.compareToGoals("2024-01-15", goals);

      expect(result).toEqual(mockComparison);
      expect(nutritionService.compareToGoals).toHaveBeenCalledWith(
        "2024-01-15",
        goals,
      );
    });
  });

  describe("getMacroBreakdown", () => {
    it("should return macro breakdown percentages", async () => {
      const mockDailyNutrition = {
        date: "2024-01-15",
        meals: [],
        mealCount: 3,
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 67,
        fiber: 30,
        sugar: 50,
        sodium: 2300,
      };

      const mockMacroBreakdown = {
        protein: 20,
        carbs: 50,
        fat: 30,
      };

      mockNutritionService.getDailyNutrition.mockResolvedValue(
        mockDailyNutrition,
      );
      mockNutritionService.getMacroBreakdown.mockReturnValue(
        mockMacroBreakdown,
      );

      const result = await controller.getMacroBreakdown("2024-01-15");

      expect(result).toEqual(mockMacroBreakdown);
      expect(nutritionService.getDailyNutrition).toHaveBeenCalledWith(
        "2024-01-15",
      );
      expect(nutritionService.getMacroBreakdown).toHaveBeenCalledWith(
        mockDailyNutrition,
      );
    });
  });
});
