import { Test, TestingModule } from "@nestjs/testing";
import { McpService } from "./mcp.service";
import { MealsService } from "../features/meals/meals.service";
import { FoodsService } from "../features/foods/foods.service";
import { NutritionService } from "../features/nutrition/nutrition.service";

describe("McpService", () => {
  let service: McpService;
  let mealsService: MealsService;
  let foodsService: FoodsService;
  let nutritionService: NutritionService;

  const mockMealsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCategorization: jest.fn(),
  };

  const mockFoodsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    searchByName: jest.fn(),
    searchByBarcode: jest.fn(),
    addFoodToMeal: jest.fn(),
    updateFoodEntry: jest.fn(),
    removeFoodEntry: jest.fn(),
  };

  const mockNutritionService = {
    getDailyNutrition: jest.fn(),
    getMealNutrition: jest.fn(),
    getWeeklyNutrition: jest.fn(),
    getMonthlyNutrition: jest.fn(),
    compareToGoals: jest.fn(),
    getMacroBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: MealsService,
          useValue: mockMealsService,
        },
        {
          provide: FoodsService,
          useValue: mockFoodsService,
        },
        {
          provide: NutritionService,
          useValue: mockNutritionService,
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
    mealsService = module.get<MealsService>(MealsService);
    foodsService = module.get<FoodsService>(FoodsService);
    nutritionService = module.get<NutritionService>(NutritionService);
  });

  describe("getAvailableTools", () => {
    it("should return all available tools", () => {
      const result = service.getAvailableTools();

      expect(result).toHaveProperty("tools");
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);

      // Check that it contains expected tool names
      const toolNames = result.tools.map((tool) => tool.name);
      expect(toolNames).toContain("get_meals");
      expect(toolNames).toContain("create_meal");
      expect(toolNames).toContain("search_foods");
      expect(toolNames).toContain("get_daily_nutrition");
    });

    it("should have proper schema for each tool", () => {
      const result = service.getAvailableTools();

      result.tools.forEach((tool) => {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(tool.inputSchema).toHaveProperty("type");
        expect(tool.inputSchema.type).toBe("object");
      });
    });
  });

  describe("callTool - Meal operations", () => {
    it("should handle get_meals", async () => {
      const mockMeals = [{ id: "1", name: "Breakfast" }];
      mockMealsService.findAll.mockResolvedValue(mockMeals);

      const result = await service.callTool("get_meals", {
        date: "2024-01-15",
        category: "breakfast",
      });

      expect(mockMealsService.findAll).toHaveBeenCalledWith({
        date: "2024-01-15",
        category: "breakfast",
      });
      expect(result).toEqual(mockMeals);
    });

    it("should handle get_meal", async () => {
      const mockMeal = { id: "1", name: "Breakfast" };
      mockMealsService.findOne.mockResolvedValue(mockMeal);

      const result = await service.callTool("get_meal", { mealId: "1" });

      expect(mockMealsService.findOne).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockMeal);
    });

    it("should handle create_meal", async () => {
      const mealData = { name: "New Meal", date: "2024-01-15" };
      const createdMeal = { id: "1", ...mealData };
      mockMealsService.create.mockResolvedValue(createdMeal);

      const result = await service.callTool("create_meal", mealData);

      expect(mockMealsService.create).toHaveBeenCalledWith(mealData);
      expect(result).toEqual(createdMeal);
    });

    it("should handle update_meal", async () => {
      const updateData = { name: "Updated Meal" };
      const updatedMeal = { id: "1", ...updateData };
      mockMealsService.update.mockResolvedValue(updatedMeal);

      const result = await service.callTool("update_meal", {
        mealId: "1",
        ...updateData,
      });

      expect(mockMealsService.update).toHaveBeenCalledWith("1", updateData);
      expect(result).toEqual(updatedMeal);
    });

    it("should handle delete_meal", async () => {
      mockMealsService.remove.mockResolvedValue(undefined);

      const result = await service.callTool("delete_meal", { mealId: "1" });

      expect(mockMealsService.remove).toHaveBeenCalledWith("1");
      expect(result).toEqual({
        success: true,
        message: "Meal deleted successfully",
      });
    });
  });

  describe("callTool - Food operations", () => {
    it("should handle search_foods by name", async () => {
      const mockFoods = [{ id: "1", name: "Apple" }];
      mockFoodsService.searchByName.mockResolvedValue(mockFoods);

      const result = await service.callTool("search_foods", {
        query: "apple",
      });

      expect(mockFoodsService.searchByName).toHaveBeenCalledWith("apple");
      expect(result).toEqual(mockFoods);
    });

    it("should handle search_foods by barcode", async () => {
      const mockFood = { id: "1", name: "Apple", barcode: "123456789" };
      mockFoodsService.searchByBarcode.mockResolvedValue(mockFood);

      const result = await service.callTool("search_foods", {
        barcode: "123456789",
      });

      expect(mockFoodsService.searchByBarcode).toHaveBeenCalledWith("123456789");
      expect(result).toEqual([mockFood]);
    });

    it("should handle search_foods by barcode when not found", async () => {
      mockFoodsService.searchByBarcode.mockResolvedValue(null);

      const result = await service.callTool("search_foods", {
        barcode: "123456789",
      });

      expect(result).toEqual([]);
    });

    it("should handle get_foods", async () => {
      const mockFoods = [{ id: "1", name: "Apple" }];
      mockFoodsService.findAll.mockResolvedValue(mockFoods);

      const result = await service.callTool("get_foods", {});

      expect(mockFoodsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockFoods);
    });

    it("should handle create_food", async () => {
      const foodData = {
        name: "Apple",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
      };
      const createdFood = { id: "1", ...foodData };
      mockFoodsService.create.mockResolvedValue(createdFood);

      const result = await service.callTool("create_food", foodData);

      expect(mockFoodsService.create).toHaveBeenCalledWith(foodData);
      expect(result).toEqual(createdFood);
    });

    it("should handle add_food_to_meal", async () => {
      const entryData = { mealId: "1", foodId: "2", quantity: 100, unit: "g" };
      const createdEntry = { id: "1", ...entryData };
      mockFoodsService.addFoodToMeal.mockResolvedValue(createdEntry);

      const result = await service.callTool("add_food_to_meal", entryData);

      expect(mockFoodsService.addFoodToMeal).toHaveBeenCalledWith("1", {
        foodId: "2",
        quantity: 100,
        unit: "g",
      });
      expect(result).toEqual(createdEntry);
    });
  });

  describe("callTool - Nutrition operations", () => {
    it("should handle get_daily_nutrition", async () => {
      const mockNutrition = { date: "2024-01-15", calories: 2000 };
      mockNutritionService.getDailyNutrition.mockResolvedValue(mockNutrition);

      const result = await service.callTool("get_daily_nutrition", {
        date: "2024-01-15",
      });

      expect(mockNutritionService.getDailyNutrition).toHaveBeenCalledWith(
        "2024-01-15",
      );
      expect(result).toEqual(mockNutrition);
    });

    it("should handle get_meal_nutrition", async () => {
      const mockNutrition = { id: "1", calories: 500 };
      mockNutritionService.getMealNutrition.mockResolvedValue(mockNutrition);

      const result = await service.callTool("get_meal_nutrition", {
        mealId: "1",
      });

      expect(mockNutritionService.getMealNutrition).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockNutrition);
    });

    it("should handle compare_to_goals", async () => {
      const goals = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
      const comparison = { nutrition: {}, goals, percentages: {}, status: {} };
      mockNutritionService.compareToGoals.mockResolvedValue(comparison);

      const result = await service.callTool("compare_to_goals", {
        date: "2024-01-15",
        goals,
      });

      expect(mockNutritionService.compareToGoals).toHaveBeenCalledWith(
        "2024-01-15",
        goals,
      );
      expect(result).toEqual(comparison);
    });

    it("should handle get_macro_breakdown", async () => {
      const nutrition = { calories: 2000, protein: 100, carbs: 250, fat: 67 };
      const breakdown = { protein: 20, carbs: 50, fat: 30 };
      mockNutritionService.getMacroBreakdown.mockResolvedValue(breakdown);

      const result = await service.callTool("get_macro_breakdown", nutrition);

      expect(mockNutritionService.getMacroBreakdown).toHaveBeenCalledWith(
        nutrition,
      );
      expect(result).toEqual(breakdown);
    });
  });

  describe("callTool - Error handling", () => {
    it("should throw error for unknown tool", async () => {
      await expect(
        service.callTool("unknown_tool", {}),
      ).rejects.toThrow("Unknown tool: unknown_tool");
    });

    it("should wrap service errors", async () => {
      mockMealsService.findOne.mockRejectedValue(new Error("Service error"));

      await expect(
        service.callTool("get_meal", { mealId: "1" }),
      ).rejects.toThrow("Error executing tool get_meal: Service error");
    });
  });

  describe("getAvailableResources", () => {
    it("should return all available resources", () => {
      const result = service.getAvailableResources();

      expect(result).toHaveProperty("resources");
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);

      // Check that it contains expected resources
      const resourceUris = result.resources.map((resource) => resource.uri);
      expect(resourceUris).toContain("foodtracker://meals");
      expect(resourceUris).toContain("foodtracker://foods");
      expect(resourceUris).toContain("foodtracker://nutrition/daily");
    });

    it("should have proper structure for each resource", () => {
      const result = service.getAvailableResources();

      result.resources.forEach((resource) => {
        expect(resource).toHaveProperty("uri");
        expect(resource).toHaveProperty("name");
        expect(resource).toHaveProperty("description");
        expect(resource).toHaveProperty("mimeType");
        expect(resource.mimeType).toBe("application/json");
      });
    });
  });

  describe("getResource", () => {
    it("should handle meals resource", async () => {
      const mockMeals = [{ id: "1", name: "Breakfast" }];
      mockMealsService.findAll.mockResolvedValue(mockMeals);

      const result = await service.getResource("foodtracker://meals");

      expect(mockMealsService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockMeals);
    });

    it("should handle meals/today resource", async () => {
      const mockMeals = [{ id: "1", name: "Today's Breakfast" }];
      mockMealsService.findAll.mockResolvedValue(mockMeals);

      const result = await service.getResource("foodtracker://meals/today");

      const today = new Date().toISOString().split("T")[0];
      expect(mockMealsService.findAll).toHaveBeenCalledWith({ date: today });
      expect(result).toEqual(mockMeals);
    });

    it("should handle foods resource", async () => {
      const mockFoods = [{ id: "1", name: "Apple" }];
      mockFoodsService.findAll.mockResolvedValue(mockFoods);

      const result = await service.getResource("foodtracker://foods");

      expect(mockFoodsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockFoods);
    });

    it("should handle nutrition/daily resource", async () => {
      const mockNutrition = { date: "today", calories: 2000 };
      mockNutritionService.getDailyNutrition.mockResolvedValue(mockNutrition);

      const result = await service.getResource("foodtracker://nutrition/daily");

      const today = new Date().toISOString().split("T")[0];
      expect(mockNutritionService.getDailyNutrition).toHaveBeenCalledWith(today);
      expect(result).toEqual(mockNutrition);
    });

    it("should handle system/info resource", async () => {
      const result = await service.getResource("foodtracker://system/info");

      expect(result).toHaveProperty("name", "FoodTracker Backend");
      expect(result).toHaveProperty("version", "1.0.0");
      expect(result).toHaveProperty("capabilities");
      expect(result).toHaveProperty("features");
      expect(result).toHaveProperty("endpoints");
    });

    it("should throw error for unknown resource", async () => {
      await expect(
        service.getResource("foodtracker://unknown"),
      ).rejects.toThrow("Unknown resource: unknown");
    });

    it("should wrap service errors in getResource", async () => {
      mockMealsService.findAll.mockRejectedValue(new Error("Service error"));

      await expect(
        service.getResource("foodtracker://meals"),
      ).rejects.toThrow(
        "Error fetching resource foodtracker://meals: Service error",
      );
    });
  });
});