import { Test, TestingModule } from "@nestjs/testing";
import { FoodsController } from "./foods.controller";
import { FoodsService } from "./foods.service";
import { FoodCacheService } from "./food-cache.service";
import { FoodsHealthService } from "./foods.health";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { fixtures } from "../../test/fixtures";

describe("FoodsController", () => {
  let controller: FoodsController;
  let foodsService: FoodsService;
  let foodCacheService: FoodCacheService;
  let foodsHealthService: FoodsHealthService;

  const mockFoodsService = {
    searchByName: jest.fn(),
    searchByBarcode: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addFoodToMeal: jest.fn(),
    updateFoodEntry: jest.fn(),
    removeFoodEntry: jest.fn(),
  };

  const mockFoodCacheService = {
    getCacheStats: jest.fn(),
    getFrequentlyUsedFoods: jest.fn(),
    cleanupOldCache: jest.fn(),
    optimizeCache: jest.fn(),
    markFoodAsUsed: jest.fn(),
  };

  const mockFoodsHealthService = {
    getHealthStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodsController],
      providers: [
        {
          provide: FoodsService,
          useValue: mockFoodsService,
        },
        {
          provide: FoodCacheService,
          useValue: mockFoodCacheService,
        },
        {
          provide: FoodsHealthService,
          useValue: mockFoodsHealthService,
        },
      ],
    }).compile();

    controller = module.get<FoodsController>(FoodsController);
    foodsService = module.get<FoodsService>(FoodsService);
    foodCacheService = module.get<FoodCacheService>(FoodCacheService);
    foodsHealthService = module.get<FoodsHealthService>(FoodsHealthService);
  });

  describe("searchFoods", () => {
    it("should search by name when query provided", async () => {
      const mockResults = [fixtures.foods.apple];
      mockFoodsService.searchByName.mockResolvedValue(mockResults);

      const result = await controller.searchFoods("apple", undefined);

      expect(result).toEqual(mockResults);
      expect(foodsService.searchByName).toHaveBeenCalledWith("apple");
    });

    it("should search by barcode when barcode provided", async () => {
      const mockResult = fixtures.foods.apple;
      mockFoodsService.searchByBarcode.mockResolvedValue(mockResult);

      const result = await controller.searchFoods(undefined, "1234567890");

      expect(result).toEqual(mockResult);
      expect(foodsService.searchByBarcode).toHaveBeenCalledWith("1234567890");
    });

    it("should throw BadRequestException when neither query nor barcode provided", () => {
      expect(() => controller.searchFoods(undefined, undefined)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when query is too short", () => {
      expect(() => controller.searchFoods("a", undefined)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when barcode is too short", () => {
      expect(() => controller.searchFoods(undefined, "1234567")).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when barcode is too long", () => {
      expect(() => controller.searchFoods(undefined, "12345678901234")).toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    it("should return all foods", async () => {
      const mockFoods = Object.values(fixtures.foods);
      mockFoodsService.findAll.mockResolvedValue(mockFoods);

      const result = await controller.findAll();

      expect(result).toEqual(mockFoods);
      expect(foodsService.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a food by id", async () => {
      const mockFood = fixtures.foods.apple;
      mockFoodsService.findOne.mockResolvedValue(mockFood);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockFood);
      expect(foodsService.findOne).toHaveBeenCalledWith("1");
    });

    it("should propagate NotFoundException", async () => {
      mockFoodsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne("999")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create a new food", async () => {
      const createDto = {
        name: "New Food",
        brand: "New Brand",
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        fiber: 2,
        sugar: 8,
        sodium: 150,
        servingSize: "100",
        servingUnit: "g",
      };

      const mockFood = { id: "1", ...createDto };
      mockFoodsService.create.mockResolvedValue(mockFood);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockFood);
      expect(foodsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe("update", () => {
    it("should update an existing food", async () => {
      const updateDto = {
        name: "Updated Food",
        calories: 150,
      };

      const mockFood = { ...fixtures.foods.apple, ...updateDto };
      mockFoodsService.update.mockResolvedValue(mockFood);

      const result = await controller.update("1", updateDto);

      expect(result).toEqual(mockFood);
      expect(foodsService.update).toHaveBeenCalledWith("1", updateDto);
    });
  });

  describe("remove", () => {
    it("should delete a food", async () => {
      mockFoodsService.remove.mockResolvedValue(undefined);

      await controller.remove("1");

      expect(foodsService.remove).toHaveBeenCalledWith("1");
    });
  });

  describe("Food Entries", () => {
    describe("addFoodToMeal", () => {
      it("should add food entry to meal", async () => {
        const createDto = {
          foodId: "1",
          quantity: 150,
          unit: "g",
        };

        const mockEntry = { id: "entry-1", mealId: "meal-1", ...createDto };
        mockFoodsService.addFoodToMeal.mockResolvedValue(mockEntry);

        const result = await controller.addFoodToMeal("meal-1", createDto);

        expect(result).toEqual(mockEntry);
        expect(foodsService.addFoodToMeal).toHaveBeenCalledWith(
          "meal-1",
          createDto,
        );
      });
    });

    describe("updateFoodEntry", () => {
      it("should update food entry", async () => {
        const updateDto = { quantity: 200 };
        const mockEntry = { id: "entry-1", quantity: 200 };
        mockFoodsService.updateFoodEntry.mockResolvedValue(mockEntry);

        const result = await controller.updateFoodEntry("entry-1", updateDto);

        expect(result).toEqual(mockEntry);
        expect(foodsService.updateFoodEntry).toHaveBeenCalledWith(
          "entry-1",
          updateDto,
        );
      });
    });

    describe("removeFoodEntry", () => {
      it("should remove food entry", async () => {
        mockFoodsService.removeFoodEntry.mockResolvedValue(undefined);

        await controller.removeFoodEntry("entry-1");

        expect(foodsService.removeFoodEntry).toHaveBeenCalledWith("entry-1");
      });
    });
  });

  describe("Cache Management", () => {
    describe("getCacheStats", () => {
      it("should return cache statistics", async () => {
        const mockStats = {
          totalCached: 100,
          recentlyUsed: 25,
          cacheHitRate: 0.75,
          lastCleanup: new Date(),
        };

        mockFoodCacheService.getCacheStats.mockResolvedValue(mockStats);

        const result = await controller.getCacheStats();

        expect(result).toEqual(mockStats);
        expect(foodCacheService.getCacheStats).toHaveBeenCalled();
      });
    });

    describe("getFrequentlyUsedFoods", () => {
      it("should return frequently used foods with default limit", async () => {
        const mockFoods = [fixtures.foods.apple, fixtures.foods.chickenBreast];
        mockFoodCacheService.getFrequentlyUsedFoods.mockResolvedValue(
          mockFoods,
        );

        const result = await controller.getFrequentlyUsedFoods(undefined);

        expect(result).toEqual(mockFoods);
        expect(foodCacheService.getFrequentlyUsedFoods).toHaveBeenCalledWith(
          20,
        );
      });

      it("should use custom limit when provided", async () => {
        const mockFoods = [fixtures.foods.apple];
        mockFoodCacheService.getFrequentlyUsedFoods.mockResolvedValue(
          mockFoods,
        );

        const result = await controller.getFrequentlyUsedFoods("10");

        expect(result).toEqual(mockFoods);
        expect(foodCacheService.getFrequentlyUsedFoods).toHaveBeenCalledWith(
          10,
        );
      });

      it("should throw BadRequestException when limit exceeds 100", () => {
        expect(() => controller.getFrequentlyUsedFoods("101")).toThrow(
          BadRequestException,
        );
      });
    });

    describe("cleanupCache", () => {
      it("should cleanup old cache", async () => {
        const mockResult = { removed: 15, freedSpace: "5MB" };
        mockFoodCacheService.cleanupOldCache.mockResolvedValue(mockResult);

        const result = await controller.cleanupCache();

        expect(result).toEqual(mockResult);
        expect(foodCacheService.cleanupOldCache).toHaveBeenCalled();
      });
    });

    describe("optimizeCache", () => {
      it("should optimize cache", async () => {
        const mockResult = { optimized: true, duration: 250 };
        mockFoodCacheService.optimizeCache.mockResolvedValue(mockResult);

        const result = await controller.optimizeCache();

        expect(result).toEqual(mockResult);
        expect(foodCacheService.optimizeCache).toHaveBeenCalled();
      });
    });

    describe("markFoodAsUsed", () => {
      it("should mark food as used", async () => {
        mockFoodCacheService.markFoodAsUsed.mockResolvedValue({
          success: true,
        });

        const result = await controller.markFoodAsUsed("1");

        expect(result).toEqual({ success: true });
        expect(foodCacheService.markFoodAsUsed).toHaveBeenCalledWith("1");
      });
    });
  });

  describe("getHealthStatus", () => {
    it("should return health status", async () => {
      const mockHealth = {
        status: "healthy",
        database: { connected: true },
        cache: { available: true },
        externalApi: { status: "operational" },
      };

      mockFoodsHealthService.getHealthStatus.mockResolvedValue(mockHealth);

      const result = await controller.getHealthStatus();

      expect(result).toEqual(mockHealth);
      expect(foodsHealthService.getHealthStatus).toHaveBeenCalled();
    });
  });
});
