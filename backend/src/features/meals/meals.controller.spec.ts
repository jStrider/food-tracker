import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { NutritionIntegrationService } from './nutrition-integration.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MealCategory } from './entities/meal.entity';
import { fixtures } from '../../test/fixtures';

describe('MealsController', () => {
  let controller: MealsController;
  let mealsService: MealsService;
  let nutritionService: NutritionIntegrationService;

  const mockMealsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDate: jest.fn(),
    getDailyNutrition: jest.fn(),
    findByDateRange: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  const mockNutritionService = {
    calculateNutritionProgress: jest.fn(),
    getDailyMacroDistribution: jest.fn(),
    getMealMacroDistribution: jest.fn(),
    calculateNutritionTrends: jest.fn(),
    suggestMealOptimization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealsController],
      providers: [
        {
          provide: MealsService,
          useValue: mockMealsService,
        },
        {
          provide: NutritionIntegrationService,
          useValue: mockNutritionService,
        },
      ],
    }).compile();

    controller = module.get<MealsController>(MealsController);
    mealsService = module.get<MealsService>(MealsService);
    nutritionService = module.get<NutritionIntegrationService>(NutritionIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated meals', async () => {
      const mockResult = {
        data: [fixtures.meals.breakfast, fixtures.meals.lunch],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockMealsService.findAll.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(mealsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass all query parameters to service', async () => {
      const query = {
        date: '2024-01-15',
        category: MealCategory.BREAKFAST,
        page: 2,
        limit: 20,
        includeFoods: true,
      };

      mockMealsService.findAll.mockResolvedValue({ data: [], total: 0, page: 2, limit: 20, totalPages: 0 });

      await controller.findAll(query);

      expect(mealsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a meal by id', async () => {
      const mockMeal = fixtures.meals.breakfast;
      mockMealsService.findOne.mockResolvedValue(mockMeal);

      const result = await controller.findOne('1', true);

      expect(result).toEqual(mockMeal);
      expect(mealsService.findOne).toHaveBeenCalledWith('1', true);
    });

    it('should default includeFoods to true', async () => {
      const mockMeal = fixtures.meals.breakfast;
      mockMealsService.findOne.mockResolvedValue(mockMeal);

      await controller.findOne('1', undefined);

      expect(mealsService.findOne).toHaveBeenCalledWith('1', true);
    });

    it('should propagate NotFoundException', async () => {
      mockMealsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDate', () => {
    it('should return meals for a specific date', async () => {
      const mockMeals = [fixtures.meals.breakfast, fixtures.meals.lunch];
      mockMealsService.findByDate.mockResolvedValue(mockMeals);

      const result = await controller.findByDate('2024-01-15', { includeFoods: true });

      expect(result).toEqual(mockMeals);
      expect(mealsService.findByDate).toHaveBeenCalledWith({
        date: '2024-01-15',
        includeFoods: true,
      });
    });

    it('should default includeFoods to true', async () => {
      mockMealsService.findByDate.mockResolvedValue([]);

      await controller.findByDate('2024-01-15', {});

      expect(mealsService.findByDate).toHaveBeenCalledWith({
        date: '2024-01-15',
        includeFoods: true,
      });
    });
  });

  describe('getDailyNutrition', () => {
    it('should return daily nutrition summary', async () => {
      const mockSummary = {
        date: '2024-01-15',
        meals: [fixtures.meals.breakfast],
        totalCalories: 300,
        totalProtein: 20,
        totalCarbs: 40,
        totalFat: 10,
        totalFiber: 5,
        totalSugar: 15,
        totalSodium: 200,
        mealCount: 1,
      };

      mockMealsService.getDailyNutrition.mockResolvedValue(mockSummary);

      const result = await controller.getDailyNutrition('2024-01-15');

      expect(result).toEqual(mockSummary);
      expect(mealsService.getDailyNutrition).toHaveBeenCalledWith('2024-01-15');
    });
  });

  describe('findByDateRange', () => {
    it('should return meals within date range', async () => {
      const mockMeals = [fixtures.meals.breakfast, fixtures.meals.lunch, fixtures.meals.dinner];
      mockMealsService.findByDateRange.mockResolvedValue(mockMeals);

      const result = await controller.findByDateRange('2024-01-01', '2024-01-31', true);

      expect(result).toEqual(mockMeals);
      expect(mealsService.findByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-01-31', true);
    });

    it('should default includeFoods to true', async () => {
      mockMealsService.findByDateRange.mockResolvedValue([]);

      await controller.findByDateRange('2024-01-01', '2024-01-31', undefined);

      expect(mealsService.findByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-01-31', true);
    });
  });

  describe('create', () => {
    it('should create a new meal', async () => {
      const createDto = {
        name: 'Test Meal',
        category: MealCategory.LUNCH,
        date: '2024-01-15',
        time: '12:30',
        notes: 'Test notes',
      };

      const mockMeal = { id: '1', ...createDto };
      mockMealsService.create.mockResolvedValue(mockMeal);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockMeal);
      expect(mealsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should create meal with food entries', async () => {
      const createDto = {
        name: 'Test Meal',
        category: MealCategory.LUNCH,
        date: '2024-01-15',
        time: '12:30',
        foods: [
          { foodId: '1', quantity: 100, unit: 'g' },
        ],
      };

      const mockMeal = { id: '1', ...createDto };
      mockMealsService.create.mockResolvedValue(mockMeal);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockMeal);
      expect(mealsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update an existing meal', async () => {
      const updateDto = {
        name: 'Updated Meal',
        notes: 'Updated notes',
      };

      const mockMeal = { id: '1', ...fixtures.meals.breakfast, ...updateDto };
      mockMealsService.update.mockResolvedValue(mockMeal);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(mockMeal);
      expect(mealsService.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should propagate NotFoundException', async () => {
      mockMealsService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a meal', async () => {
      mockMealsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(mealsService.remove).toHaveBeenCalledWith('1');
    });

    it('should propagate NotFoundException', async () => {
      mockMealsService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return meal statistics', async () => {
      const mockStats = {
        totalMeals: 10,
        averageCalories: 500,
        averageProtein: 25,
        averageCarbs: 60,
        averageFat: 20,
        mostCommonCategory: MealCategory.LUNCH,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
      };

      mockMealsService.getStats.mockResolvedValue(mockStats);

      const query = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const result = await controller.getStats(query);

      expect(result).toEqual(mockStats);
      expect(mealsService.getStats).toHaveBeenCalledWith(query);
    });
  });

  describe('Nutrition Integration Endpoints', () => {
    describe('calculateNutritionProgress', () => {
      it('should calculate nutrition progress', async () => {
        const goals = {
          calories: 2000,
          protein: 50,
          carbs: 250,
          fat: 65,
          fiber: 25,
          sugar: 50,
          sodium: 2300,
        };

        const mockProgress = {
          date: '2024-01-15',
          goals,
          actual: {
            calories: 1800,
            protein: 45,
            carbs: 220,
            fat: 60,
            fiber: 20,
            sugar: 40,
            sodium: 2000,
          },
          progress: {
            calories: 90,
            protein: 90,
            carbs: 88,
            fat: 92,
            fiber: 80,
            sugar: 80,
            sodium: 87,
          },
          status: 'on-track',
        };

        mockNutritionService.calculateNutritionProgress.mockResolvedValue(mockProgress);

        const result = await controller.calculateNutritionProgress('2024-01-15', goals);

        expect(result).toEqual(mockProgress);
        expect(nutritionService.calculateNutritionProgress).toHaveBeenCalledWith('2024-01-15', goals);
      });
    });

    describe('getDailyMacroDistribution', () => {
      it('should return daily macro distribution', async () => {
        const mockDistribution = {
          date: '2024-01-15',
          calories: 2000,
          distribution: {
            protein: { grams: 100, calories: 400, percentage: 20 },
            carbs: { grams: 250, calories: 1000, percentage: 50 },
            fat: { grams: 67, calories: 600, percentage: 30 },
          },
        };

        mockNutritionService.getDailyMacroDistribution.mockResolvedValue(mockDistribution);

        const result = await controller.getDailyMacroDistribution('2024-01-15');

        expect(result).toEqual(mockDistribution);
        expect(nutritionService.getDailyMacroDistribution).toHaveBeenCalledWith('2024-01-15');
      });
    });

    describe('getMealMacroDistribution', () => {
      it('should return meal macro distribution', async () => {
        const mockDistribution = {
          mealId: '1',
          calories: 500,
          distribution: {
            protein: { grams: 30, calories: 120, percentage: 24 },
            carbs: { grams: 60, calories: 240, percentage: 48 },
            fat: { grams: 16, calories: 140, percentage: 28 },
          },
        };

        mockNutritionService.getMealMacroDistribution.mockResolvedValue(mockDistribution);

        const result = await controller.getMealMacroDistribution('1');

        expect(result).toEqual(mockDistribution);
        expect(nutritionService.getMealMacroDistribution).toHaveBeenCalledWith('1');
      });
    });

    describe('getNutritionTrends', () => {
      it('should return nutrition trends', async () => {
        const mockTrends = {
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          trends: {
            calories: { average: 1950, trend: 'stable' },
            protein: { average: 75, trend: 'increasing' },
            carbs: { average: 240, trend: 'decreasing' },
            fat: { average: 65, trend: 'stable' },
          },
        };

        mockNutritionService.calculateNutritionTrends.mockResolvedValue(mockTrends);

        const result = await controller.getNutritionTrends('2024-01-01', '2024-01-31');

        expect(result).toEqual(mockTrends);
        expect(nutritionService.calculateNutritionTrends).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      });
    });

    describe('getMealOptimization', () => {
      it('should return meal optimization suggestions', async () => {
        const mockSuggestions = {
          date: '2024-01-15',
          currentNutrition: {
            calories: 1500,
            protein: 60,
            carbs: 180,
            fat: 50,
          },
          suggestions: [
            {
              meal: 'dinner',
              recommendation: 'Add more protein',
              suggestedFoods: ['chicken', 'fish', 'tofu'],
            },
          ],
        };

        mockNutritionService.suggestMealOptimization.mockResolvedValue(mockSuggestions);

        const result = await controller.getMealOptimization('2024-01-15');

        expect(result).toEqual(mockSuggestions);
        expect(nutritionService.suggestMealOptimization).toHaveBeenCalledWith('2024-01-15');
      });
    });
  });
});