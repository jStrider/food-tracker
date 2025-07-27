import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FoodsService } from "./foods.service";
import { Food } from "./entities/food.entity";
import { FoodEntry } from "./entities/food-entry.entity";
import { OpenFoodFactsService } from "./open-food-facts.service";
import { FoodCacheService } from "./food-cache.service";
import { NotFoundException } from "@nestjs/common";
import { fixtures } from "../../test/fixtures";

describe("FoodsService", () => {
  let service: FoodsService;
  let foodsRepository: Repository<Food>;
  let foodEntriesRepository: Repository<FoodEntry>;
  let openFoodFactsService: OpenFoodFactsService;
  let foodCacheService: FoodCacheService;

  const _mockFoodsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const _mockFoodEntriesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const _mockOpenFoodFactsService = {
    searchByName: jest.fn(),
    searchByBarcode: jest.fn(),
  };

  const _mockFoodCacheService = {
    shouldCacheFood: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodsService,
        {
          provide: getRepositoryToken(Food),
          useValue: mockFoodsRepository,
        },
        {
          provide: getRepositoryToken(FoodEntry),
          useValue: mockFoodEntriesRepository,
        },
        {
          provide: OpenFoodFactsService,
          useValue: mockOpenFoodFactsService,
        },
        {
          provide: FoodCacheService,
          useValue: mockFoodCacheService,
        },
      ],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
    foodsRepository = module.get<Repository<Food>>(getRepositoryToken(Food));
    foodEntriesRepository = module.get<Repository<FoodEntry>>(
      getRepositoryToken(FoodEntry),
    );
    openFoodFactsService =
      module.get<OpenFoodFactsService>(OpenFoodFactsService);
    foodCacheService = module.get<FoodCacheService>(FoodCacheService);
  });

  describe("searchByName", () => {
    it("should return local results when sufficient foods found", async () => {
      const _localFoods = [
        fixtures.foods.apple,
        fixtures.foods.chickenBreast,
        fixtures.foods.brownRice,
        fixtures.foods.yogurt,
        { ...fixtures.foods.apple, name: "Apple Juice" },
      ];

      mockFoodsRepository.find.mockResolvedValue(localFoods);

      const _result = await service.searchByName("apple");

      expect(result).toHaveLength(5);
      expect(result[0].isFromCache).toBe(true);
      expect(mockOpenFoodFactsService.searchByName).not.toHaveBeenCalled();
    });

    it("should search external API when local results insufficient", async () => {
      const _localFoods = [fixtures.foods.apple];
      const _externalResults = [
        {
          name: "Apple Pie",
          brand: "Generic",
          calories: 237,
          protein: 2,
          carbs: 34,
          fat: 11,
          confidence: 0.9,
        },
        {
          name: "Apple Sauce",
          brand: "Motts",
          calories: 83,
          protein: 0,
          carbs: 20,
          fat: 0,
          confidence: 0.85,
        },
      ];

      mockFoodsRepository.find.mockResolvedValue(localFoods);
      mockOpenFoodFactsService.searchByName.mockResolvedValue(externalResults);
      mockFoodCacheService.shouldCacheFood.mockReturnValue(true);
      mockFoodsRepository.findOne.mockResolvedValue(null);
      mockFoodsRepository.create.mockImplementation((dto) => ({
        ...dto,
        id: "new-id",
      }));
      mockFoodsRepository.save.mockImplementation((food) =>
        Promise.resolve(food),
      );

      const _result = await service.searchByName("apple");

      expect(result.length).toBeGreaterThan(1);
      expect(mockOpenFoodFactsService.searchByName).toHaveBeenCalledWith(
        "apple",
      );
      expect(mockFoodCacheService.shouldCacheFood).toHaveBeenCalled();
    });

    it("should return only local results when external API fails", async () => {
      const _localFoods = [fixtures.foods.apple, fixtures.foods.chickenBreast];

      mockFoodsRepository.find.mockResolvedValue(localFoods);
      mockOpenFoodFactsService.searchByName.mockRejectedValue(
        new Error("API Error"),
      );

      const _result = await service.searchByName("food");

      expect(result).toHaveLength(2);
      expect(result[0].isFromCache).toBe(true);
    });

    it("should deduplicate results from local and external sources", async () => {
      const _localFoods = [fixtures.foods.apple];
      const _externalResults = [
        {
          ...fixtures.foods.apple,
          barcode: fixtures.foods.apple.barcode, // Same barcode
          confidence: 0.9,
        },
      ];

      mockFoodsRepository.find.mockResolvedValue(localFoods);
      mockOpenFoodFactsService.searchByName.mockResolvedValue(externalResults);
      mockFoodCacheService.shouldCacheFood.mockReturnValue(false);

      const _result = await service.searchByName("apple");

      expect(result).toHaveLength(1); // Deduplicated
      expect(result[0].isFromCache).toBe(true); // Local result preferred
    });
  });

  describe("searchByBarcode", () => {
    it("should return food from local cache", async () => {
      const _mockFood = fixtures.foods.apple;
      mockFoodsRepository.findOne.mockResolvedValueOnce(mockFood);

      const _result = await service.searchByBarcode("1111111111");

      expect(result).toBeDefined();
      expect(result.isFromCache).toBe(true);
      expect(result.name).toBe("Apple");
      expect(mockOpenFoodFactsService.searchByBarcode).not.toHaveBeenCalled();
    });

    it("should search external API when not in cache", async () => {
      const _externalFood = fixtures.foods.yogurt;

      // First call to check cache - return null
      mockFoodsRepository.findOne.mockResolvedValueOnce(null);

      // External API returns the food
      mockOpenFoodFactsService.searchByBarcode.mockResolvedValueOnce(
        externalFood,
      );

      // Second and third calls for duplicate check
      mockFoodsRepository.findOne.mockResolvedValueOnce(null); // Check by barcode
      mockFoodsRepository.findOne.mockResolvedValueOnce(null); // Check by name+brand

      // Create and save
      mockFoodsRepository.create.mockReturnValueOnce(externalFood);
      mockFoodsRepository.save.mockResolvedValueOnce(externalFood);

      const _result = await service.searchByBarcode("4444444444");

      expect(result).toBeDefined();
      expect(result.isFromCache).toBe(false);
      expect(result.name).toBe("Greek Yogurt");
      expect(mockOpenFoodFactsService.searchByBarcode).toHaveBeenCalledWith(
        "4444444444",
      );
    });

    it("should return null when food not found", async () => {
      mockFoodsRepository.findOne.mockResolvedValueOnce(null);
      mockOpenFoodFactsService.searchByBarcode.mockResolvedValueOnce(null);

      const _result = await service.searchByBarcode("9999999999");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all foods", async () => {
      const _allFoods = Object.values(fixtures.foods);
      mockFoodsRepository.find.mockResolvedValue(allFoods);

      const _result = await service.findAll();

      expect(result).toEqual(allFoods);
      expect(mockFoodsRepository.find).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a food by id", async () => {
      const _mockFood = fixtures.foods.apple;
      mockFoodsRepository.findOne.mockResolvedValue(mockFood);

      const _result = await service.findOne("1");

      expect(result).toEqual(mockFood);
      expect(mockFoodsRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw NotFoundException when food not found", async () => {
      mockFoodsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a new food", async () => {
      const _createDto = {
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

      const _mockFood = { id: "new-id", ...createDto };
      mockFoodsRepository.create.mockReturnValue(mockFood);
      mockFoodsRepository.save.mockResolvedValue(mockFood);

      const _result = await service.create(createDto);

      expect(result).toEqual(mockFood);
      expect(mockFoodsRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockFoodsRepository.save).toHaveBeenCalledWith(mockFood);
    });
  });

  describe("update", () => {
    it("should update an existing food", async () => {
      const _updateDto = {
        name: "Updated Apple",
        calories: 55,
      };

      const _existingFood = fixtures.foods.apple;
      const _updatedFood = { ...existingFood, ...updateDto };

      mockFoodsRepository.findOne
        .mockResolvedValueOnce(existingFood)
        .mockResolvedValueOnce(updatedFood);
      mockFoodsRepository.update.mockResolvedValue({ affected: 1 });

      const _result = await service.update("1", updateDto);

      expect(result).toEqual(updatedFood);
      expect(mockFoodsRepository.update).toHaveBeenCalledWith("1", updateDto);
    });

    it("should throw NotFoundException when food not found", async () => {
      mockFoodsRepository.findOne.mockResolvedValue(null);

      await expect(service.update("999", {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete a food", async () => {
      mockFoodsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove("1");

      expect(mockFoodsRepository.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("Food Entries Management", () => {
    describe("addFoodToMeal", () => {
      it("should add food entry to meal", async () => {
        const _createDto = {
          foodId: "1",
          quantity: 150,
          unit: "g",
        };

        const _mockFood = fixtures.foods.apple;
        const _mockEntry = { id: "entry-1", mealId: "meal-1", ...createDto };

        mockFoodsRepository.findOne.mockResolvedValue(mockFood);
        mockFoodEntriesRepository.create.mockReturnValue(mockEntry);
        mockFoodEntriesRepository.save.mockResolvedValue(mockEntry);

        const _result = await service.addFoodToMeal("meal-1", createDto);

        expect(result).toEqual(mockEntry);
        expect(mockFoodEntriesRepository.create).toHaveBeenCalledWith({
          ...createDto,
          mealId: "meal-1",
        });
      });

      it("should throw NotFoundException when food not found", async () => {
        mockFoodsRepository.findOne.mockResolvedValue(null);

        await expect(
          service.addFoodToMeal("meal-1", { foodId: "999", quantity: 100 }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe("updateFoodEntry", () => {
      it("should update food entry", async () => {
        const _updateDto = { quantity: 200 };
        const _existingEntry = { id: "entry-1", foodId: "1", quantity: 150 };
        const _updatedEntry = { ...existingEntry, ...updateDto };

        mockFoodEntriesRepository.findOne
          .mockResolvedValueOnce(existingEntry)
          .mockResolvedValueOnce(updatedEntry);
        mockFoodEntriesRepository.update.mockResolvedValue({ affected: 1 });

        const _result = await service.updateFoodEntry("entry-1", updateDto);

        expect(result).toEqual(updatedEntry);
        expect(mockFoodEntriesRepository.update).toHaveBeenCalledWith(
          "entry-1",
          updateDto,
        );
      });

      it("should throw NotFoundException when entry not found", async () => {
        mockFoodEntriesRepository.findOne.mockResolvedValue(null);

        await expect(service.updateFoodEntry("999", {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe("removeFoodEntry", () => {
      it("should remove food entry", async () => {
        mockFoodEntriesRepository.delete.mockResolvedValue({ affected: 1 });

        await service.removeFoodEntry("entry-1");

        expect(mockFoodEntriesRepository.delete).toHaveBeenCalledWith(
          "entry-1",
        );
      });

      it("should throw NotFoundException when entry not found", async () => {
        mockFoodEntriesRepository.delete.mockResolvedValue({ affected: 0 });

        await expect(service.removeFoodEntry("999")).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe("Private Methods", () => {
    it("should cache high quality foods from external results", async () => {
      const _localFoods = [];
      const _externalResults = [
        {
          name: "High Quality Food",
          brand: "Premium",
          calories: 100,
          protein: 20,
          carbs: 10,
          fat: 5,
          confidence: 0.95,
        },
        {
          name: "Low Quality Food",
          brand: "Generic",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          confidence: 0.3,
        },
      ];

      mockFoodsRepository.find.mockResolvedValue(localFoods);
      mockOpenFoodFactsService.searchByName.mockResolvedValue(externalResults);
      mockFoodCacheService.shouldCacheFood
        .mockReturnValueOnce(true) // High quality
        .mockReturnValueOnce(false); // Low quality
      mockFoodsRepository.findOne.mockResolvedValue(null);
      mockFoodsRepository.create.mockImplementation((dto) => ({
        ...dto,
        id: "new-id",
      }));
      mockFoodsRepository.save.mockImplementation((food) =>
        Promise.resolve(food),
      );

      const _result = await service.searchByName("food");

      expect(mockFoodCacheService.shouldCacheFood).toHaveBeenCalledTimes(2);
      expect(mockFoodsRepository.save).toHaveBeenCalledTimes(1); // Only high quality cached
    });
  });
});
