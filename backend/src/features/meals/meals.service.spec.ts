import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import {
  Repository,
  DataSource,
  QueryRunner,
  SelectQueryBuilder,
} from "typeorm";
import { MealsService } from "./meals.service";
import { Meal, MealCategory } from "./entities/meal.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { Food } from "../foods/entities/food.entity";
import { fixtures } from "../../test/fixtures";

describe("MealsService", () => {
  let service: MealsService;
  let mealsRepository: Repository<Meal>;
  let foodEntriesRepository: Repository<FoodEntry>;
  let foodsRepository: Repository<Food>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        {
          provide: getRepositoryToken(Meal),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FoodEntry),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Food),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
    mealsRepository = module.get<Repository<Meal>>(getRepositoryToken(Meal));
    foodEntriesRepository = module.get<Repository<FoodEntry>>(
      getRepositoryToken(FoodEntry),
    );
    foodsRepository = module.get<Repository<Food>>(getRepositoryToken(Food));
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();

    // Mock the logger to prevent error logs in tests
    (service as any).logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated meals", async () => {
      const mockMeals = [fixtures.meals.breakfast, fixtures.meals.lunch];
      const mockTotal = 2;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockMeals,
        mockTotal,
      ]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockMeals,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should filter by date", async () => {
      const mockMeals = [fixtures.meals.breakfast];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockMeals, 1]);

      await service.findAll({ date: "2024-01-15", page: 1, limit: 10 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "meal.date = :date",
        { date: "2024-01-15" },
      );
    });

    it("should filter by date range", async () => {
      const mockMeals = [fixtures.meals.breakfast, fixtures.meals.lunch];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockMeals, 2]);

      await service.findAll({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "meal.date BETWEEN :startDate AND :endDate",
        { startDate: "2024-01-01", endDate: "2024-01-31" },
      );
    });

    it("should filter by category", async () => {
      const mockMeals = [fixtures.meals.breakfast];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockMeals, 1]);

      await service.findAll({
        category: MealCategory.BREAKFAST,
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "meal.category = :category",
        { category: MealCategory.BREAKFAST },
      );
    });

    it("should include foods when requested", async () => {
      const mockMeals = [fixtures.meals.breakfast];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockMeals, 1]);

      await service.findAll({ includeFoods: true, page: 1, limit: 10 });

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "meal.foods",
        "foods",
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "foods.food",
        "food",
      );
    });
  });

  describe("findOne", () => {
    it("should return a meal by id", async () => {
      const mockMeal = fixtures.meals.breakfast;
      mockQueryBuilder.getOne.mockResolvedValue(mockMeal);

      const result = await service.findOne("1");

      expect(result).toEqual(mockMeal);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("meal.id = :id", {
        id: "1",
      });
    });

    it("should throw NotFoundException when meal not found", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });

    it("should include foods by default", async () => {
      const mockMeal = fixtures.meals.breakfast;
      mockQueryBuilder.getOne.mockResolvedValue(mockMeal);

      await service.findOne("1");

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "meal.foods",
        "foods",
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "foods.food",
        "food",
      );
    });

    it("should not include foods when includeFoods is false", async () => {
      const mockMeal = fixtures.meals.breakfast;
      mockQueryBuilder.getOne.mockResolvedValue(mockMeal);

      await service.findOne("1", false);

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });
  });

  describe("findByDate", () => {
    it("should return meals for a specific date", async () => {
      const mockMeals = [fixtures.meals.breakfast, fixtures.meals.lunch];
      mockQueryBuilder.getMany.mockResolvedValue(mockMeals);

      const result = await service.findByDate({ date: "2024-01-15" });

      expect(result).toEqual(mockMeals);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("meal.date = :date", {
        date: "2024-01-15",
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("meal.time", "ASC");
    });

    it("should include foods by default", async () => {
      const mockMeals = [fixtures.meals.breakfast];
      mockQueryBuilder.getMany.mockResolvedValue(mockMeals);

      await service.findByDate({ date: "2024-01-15" });

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "meal.foods",
        "foods",
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "foods.food",
        "food",
      );
    });
  });

  describe("getDailyNutrition", () => {
    it("should calculate daily nutrition summary", async () => {
      const mockMeals = [
        {
          ...fixtures.meals.breakfast,
          totalCalories: 300,
          totalProtein: 10,
          totalCarbs: 40,
          totalFat: 12,
          totalFiber: 5,
          totalSugar: 15,
          totalSodium: 200,
        },
        {
          ...fixtures.meals.lunch,
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 60,
          totalFat: 15,
          totalFiber: 8,
          totalSugar: 10,
          totalSodium: 400,
        },
      ];

      jest.spyOn(service, "findByDate").mockResolvedValue(mockMeals as any);

      const result = await service.getDailyNutrition("2024-01-15");

      expect(result).toEqual({
        date: "2024-01-15",
        meals: mockMeals,
        totalCalories: 800,
        totalProtein: 40,
        totalCarbs: 100,
        totalFat: 27,
        totalFiber: 13,
        totalSugar: 25,
        totalSodium: 600,
        mealCount: 2,
      });
    });

    it("should return zero totals for no meals", async () => {
      jest.spyOn(service, "findByDate").mockResolvedValue([]);

      const result = await service.getDailyNutrition("2024-01-15");

      expect(result.totalCalories).toBe(0);
      expect(result.mealCount).toBe(0);
    });
  });

  describe("create", () => {
    it("should create a meal successfully", async () => {
      const createDto = {
        name: "Test Meal",
        category: MealCategory.LUNCH,
        date: "2024-01-15",
        time: "12:30",
        notes: "Test notes",
      };

      const mockMeal = { id: "1", ...createDto };

      mockQueryRunner.manager.create.mockReturnValue(mockMeal);
      mockQueryRunner.manager.save.mockResolvedValue(mockMeal);
      jest.spyOn(service, "findOne").mockResolvedValue(mockMeal as any);

      const result = await service.create(createDto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockMeal);
    });

    it("should auto-categorize meal by time when category not provided", async () => {
      const createDto = {
        name: "Test Meal",
        date: "2024-01-15",
        time: "08:30", // Should be breakfast
      };

      const mockMeal = {
        id: "1",
        ...createDto,
        category: MealCategory.BREAKFAST,
      };

      mockQueryRunner.manager.create.mockReturnValue(mockMeal);
      mockQueryRunner.manager.save.mockResolvedValue(mockMeal);
      jest.spyOn(service, "findOne").mockResolvedValue(mockMeal as any);

      await service.create(createDto);

      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        Meal,
        expect.objectContaining({
          category: MealCategory.BREAKFAST,
        }),
      );
    });

    it("should create meal with food entries", async () => {
      const createDto = {
        name: "Test Meal",
        category: MealCategory.LUNCH,
        date: "2024-01-15",
        time: "12:30",
        foods: [
          { foodId: "1", quantity: 100, unit: "g" },
          { foodId: "2", quantity: 200, unit: "g" },
        ],
      };

      const mockMeal = { id: "1", ...createDto };
      const mockFood = fixtures.foods.apple;

      mockQueryRunner.manager.create.mockReturnValue(mockMeal);
      mockQueryRunner.manager.save.mockResolvedValue(mockMeal);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockFood);
      jest.spyOn(service, "findOne").mockResolvedValue(mockMeal as any);

      await service.create(createDto);

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledTimes(2); // For each food
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        FoodEntry,
        expect.objectContaining({
          mealId: "1",
          foodId: "1",
          quantity: 100,
          unit: "g",
        }),
      );
    });

    it("should rollback transaction on error", async () => {
      const createDto = {
        name: "Test Meal",
        category: MealCategory.LUNCH,
        date: "2024-01-15",
        time: "12:30",
      };

      mockQueryRunner.manager.save.mockRejectedValueOnce(
        new Error("Database error"),
      );

      await expect(service.create(createDto)).rejects.toThrow("Database error");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a meal successfully", async () => {
      const updateDto = {
        name: "Updated Meal",
        notes: "Updated notes",
      };

      const existingMeal = fixtures.meals.breakfast;
      const updatedMeal = { ...existingMeal, ...updateDto };

      jest
        .spyOn(service, "findOne")
        .mockResolvedValueOnce(existingMeal as any)
        .mockResolvedValueOnce(updatedMeal as any);

      const result = await service.update("1", updateDto);

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        Meal,
        "1",
        expect.objectContaining({
          name: "Updated Meal",
          notes: "Updated notes",
        }),
      );
      expect(result).toEqual(updatedMeal);
    });

    it("should auto-categorize when time changes but category not provided", async () => {
      const updateDto = {
        time: "08:30", // Should be breakfast
      };

      const existingMeal = {
        ...fixtures.meals.lunch,
        category: MealCategory.LUNCH,
      };

      jest.spyOn(service, "findOne").mockResolvedValue(existingMeal as any);

      await service.update("1", updateDto);

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        Meal,
        "1",
        expect.objectContaining({
          time: "08:30",
          category: MealCategory.BREAKFAST,
        }),
      );
    });

    it("should update food entries", async () => {
      const updateDto = {
        foods: [
          { id: "1", quantity: 150 }, // Update existing
          { foodId: "3", quantity: 100, unit: "g" }, // Add new
        ],
      };

      const existingMeal = fixtures.meals.breakfast;
      const existingEntries = [
        { id: "1", mealId: "1", foodId: "1" },
        { id: "2", mealId: "1", foodId: "2" },
      ];
      const mockFood = fixtures.foods.brownRice;
      const updatedMeal = { ...existingMeal, foods: updateDto.foods };

      jest
        .spyOn(service, "findOne")
        .mockResolvedValueOnce(existingMeal as any)
        .mockResolvedValueOnce(updatedMeal as any);
      mockQueryRunner.manager.find.mockResolvedValue(existingEntries);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockFood);

      await service.update("1", updateDto);

      // Should delete entry with id '2' (not in update list)
      expect(mockQueryRunner.manager.delete).toHaveBeenCalledWith(FoodEntry, [
        "2",
      ]);

      // Should update entry with id '1'
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        FoodEntry,
        "1",
        expect.objectContaining({ quantity: 150 }),
      );

      // Should create new entry
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        FoodEntry,
        expect.objectContaining({
          mealId: "1",
          foodId: "3",
          quantity: 100,
          unit: "g",
        }),
      );
    });

    it("should throw NotFoundException when meal not found", async () => {
      jest.spyOn(service, "findOne").mockRejectedValue(new NotFoundException());

      await expect(service.update("999", {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete a meal", async () => {
      const mockMeal = fixtures.meals.breakfast;
      jest.spyOn(service, "findOne").mockResolvedValue(mockMeal as any);

      await service.remove("1");

      expect(mealsRepository.remove).toHaveBeenCalledWith(mockMeal);
    });

    it("should throw NotFoundException when meal not found", async () => {
      jest.spyOn(service, "findOne").mockRejectedValue(new NotFoundException());

      await expect(service.remove("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getStats", () => {
    it("should calculate meal statistics", async () => {
      const mockMeals = [
        {
          ...fixtures.meals.breakfast,
          totalCalories: 300,
          totalProtein: 10,
          totalCarbs: 40,
          totalFat: 12,
          category: MealCategory.BREAKFAST,
        },
        {
          ...fixtures.meals.lunch,
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 60,
          totalFat: 15,
          category: MealCategory.LUNCH,
        },
        {
          ...fixtures.meals.dinner,
          totalCalories: 600,
          totalProtein: 40,
          totalCarbs: 70,
          totalFat: 20,
          category: MealCategory.LUNCH,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockMeals);

      const result = await service.getStats({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toEqual({
        totalMeals: 3,
        averageCalories: 467, // (300 + 500 + 600) / 3
        averageProtein: 27, // (10 + 30 + 40) / 3
        averageCarbs: 57, // (40 + 60 + 70) / 3
        averageFat: 16, // (12 + 15 + 20) / 3
        mostCommonCategory: MealCategory.LUNCH, // 2 occurrences
        dateRange: {
          start: "2024-01-01",
          end: "2024-01-31",
        },
      });
    });

    it("should return empty stats when no meals found", async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getStats({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.totalMeals).toBe(0);
      expect(result.averageCalories).toBe(0);
    });

    it("should filter by category", async () => {
      const mockMeals = [fixtures.meals.breakfast];
      mockQueryBuilder.getMany.mockResolvedValue(mockMeals);

      await service.getStats({
        category: MealCategory.BREAKFAST,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "meal.category = :category",
        { category: MealCategory.BREAKFAST },
      );
    });
  });

  describe("autoCategorizeByTime", () => {
    it.each([
      ["05:30", MealCategory.BREAKFAST],
      ["08:00", MealCategory.BREAKFAST],
      ["10:59", MealCategory.BREAKFAST],
      ["11:00", MealCategory.LUNCH],
      ["13:30", MealCategory.LUNCH],
      ["15:59", MealCategory.LUNCH],
      ["16:00", MealCategory.DINNER],
      ["19:00", MealCategory.DINNER],
      ["21:59", MealCategory.DINNER],
      ["22:00", MealCategory.SNACK],
      ["23:30", MealCategory.SNACK],
      ["02:00", MealCategory.SNACK],
    ])("should categorize %s as %s", (time, expectedCategory) => {
      const result = (service as any).autoCategorizeByTime(time);
      expect(result).toBe(expectedCategory);
    });
  });

  describe("getCategorization", () => {
    it("should return default categorization logic", async () => {
      const result = await service.getCategorization();

      expect(result).toEqual({
        defaultRanges: {
          breakfast: { start: "05:00", end: "11:00" },
          lunch: { start: "11:00", end: "16:00" },
          dinner: { start: "16:00", end: "22:00" },
          snack: "Other times",
        },
        categories: Object.values(MealCategory),
        logic: expect.any(String),
      });
    });

    it("should return custom ranges when provided", async () => {
      const customRanges = {
        breakfast: { start: "06:00", end: "10:00" },
        lunch: { start: "12:00", end: "14:00" },
        dinner: { start: "18:00", end: "20:00" },
        snack: "Other times",
      };

      const result = await service.getCategorization(customRanges);

      expect(result.defaultRanges).toEqual(customRanges);
    });
  });
});
