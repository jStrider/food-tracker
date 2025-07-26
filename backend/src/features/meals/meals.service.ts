import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, QueryRunner } from 'typeorm';
import { Meal, MealCategory } from './entities/meal.entity';
import { FoodEntry } from '../foods/entities/food-entry.entity';
import { Food } from '../foods/entities/food.entity';
import { 
  CreateMealDto, 
  UpdateMealDto, 
  MealQueryDto, 
  DailyMealsQueryDto,
  MealStatsQueryDto,
  CreateFoodEntryDto,
  UpdateFoodEntryDto 
} from './dto';

export interface PaginatedMeals {
  data: Meal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MealFilterOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  category?: MealCategory;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface DailyNutritionSummary {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealCount: number;
}

export interface MealStats {
  totalMeals: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  mostCommonCategory: MealCategory;
  dateRange: {
    start: string;
    end: string;
  };
}

@Injectable()
export class MealsService {
  private readonly logger = new Logger(MealsService.name);

  constructor(
    @InjectRepository(Meal)
    private mealsRepository: Repository<Meal>,
    @InjectRepository(FoodEntry)
    private foodEntriesRepository: Repository<FoodEntry>,
    @InjectRepository(Food)
    private foodsRepository: Repository<Food>,
    private dataSource: DataSource,
  ) {}

  /**
   * Find meals with pagination and filtering
   */
  async findAll(query: MealQueryDto): Promise<PaginatedMeals> {
    const { 
      date, 
      startDate, 
      endDate, 
      category, 
      limit = 20, 
      page = 1, 
      includeFoods = false 
    } = query;

    const queryBuilder = this.mealsRepository.createQueryBuilder('meal');

    if (includeFoods) {
      queryBuilder
        .leftJoinAndSelect('meal.foods', 'foods')
        .leftJoinAndSelect('foods.food', 'food');
    }

    // Apply filters
    if (date) {
      queryBuilder.andWhere('meal.date = :date', { date });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('meal.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (category) {
      queryBuilder.andWhere('meal.category = :category', { category });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder
      .orderBy('meal.date', 'DESC')
      .addOrderBy('meal.time', 'ASC')
      .addOrderBy('meal.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find a single meal by ID
   */
  async findOne(id: string, includeFoods: boolean = true): Promise<Meal> {
    const queryBuilder = this.mealsRepository.createQueryBuilder('meal')
      .where('meal.id = :id', { id });

    if (includeFoods) {
      queryBuilder
        .leftJoinAndSelect('meal.foods', 'foods')
        .leftJoinAndSelect('foods.food', 'food');
    }

    const meal = await queryBuilder.getOne();

    if (!meal) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }

    return meal;
  }

  /**
   * Find all meals for a specific date
   */
  async findByDate(query: DailyMealsQueryDto): Promise<Meal[]> {
    const { date, includeFoods = true } = query;

    const queryBuilder = this.mealsRepository.createQueryBuilder('meal')
      .where('meal.date = :date', { date });

    if (includeFoods) {
      queryBuilder
        .leftJoinAndSelect('meal.foods', 'foods')
        .leftJoinAndSelect('foods.food', 'food');
    }

    return queryBuilder
      .orderBy('meal.time', 'ASC')
      .addOrderBy('meal.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Get daily nutrition summary
   */
  async getDailyNutrition(date: string): Promise<DailyNutritionSummary> {
    const meals = await this.findByDate({ date, includeFoods: true });

    const summary: DailyNutritionSummary = {
      date,
      meals,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0,
      mealCount: meals.length,
    };

    // Calculate totals
    for (const meal of meals) {
      summary.totalCalories += meal.totalCalories;
      summary.totalProtein += meal.totalProtein;
      summary.totalCarbs += meal.totalCarbs;
      summary.totalFat += meal.totalFat;
      summary.totalFiber += meal.totalFiber;
      summary.totalSugar += meal.totalSugar;
      summary.totalSodium += meal.totalSodium;
    }

    return summary;
  }

  /**
   * Find meals by date range
   */
  async findByDateRange(startDate: string, endDate: string, includeFoods: boolean = true): Promise<Meal[]> {
    const queryBuilder = this.mealsRepository.createQueryBuilder('meal')
      .where('meal.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (includeFoods) {
      queryBuilder
        .leftJoinAndSelect('meal.foods', 'foods')
        .leftJoinAndSelect('foods.food', 'food');
    }

    return queryBuilder
      .orderBy('meal.date', 'DESC')
      .addOrderBy('meal.time', 'ASC')
      .addOrderBy('meal.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Create a new meal with optional food entries
   */
  async create(createMealDto: CreateMealDto): Promise<Meal> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Auto-categorize if not provided
      let category = createMealDto.category;
      if (!category && createMealDto.time) {
        category = this.autoCategorizeByTime(createMealDto.time);
      } else if (!category) {
        category = this.autoCategorizeByTime(new Date().toTimeString().slice(0, 5));
      }

      // Create meal
      const mealData = {
        name: createMealDto.name,
        category,
        date: new Date(createMealDto.date),
        time: createMealDto.time,
        notes: createMealDto.notes,
        userId: '1', // TODO: Get from auth context
      };

      const meal = queryRunner.manager.create(Meal, mealData);
      const savedMeal = await queryRunner.manager.save(meal);

      // Add food entries if provided
      if (createMealDto.foods && createMealDto.foods.length > 0) {
        await this.createFoodEntries(queryRunner, savedMeal.id, createMealDto.foods);
      }

      await queryRunner.commitTransaction();

      // Return meal with food entries
      return this.findOne(savedMeal.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create meal', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an existing meal
   */
  async update(id: string, updateMealDto: UpdateMealDto): Promise<Meal> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if meal exists
      const existingMeal = await this.findOne(id, false);

      // Prepare update data
      const updateData: any = {};
      if (updateMealDto.name !== undefined) updateData.name = updateMealDto.name;
      if (updateMealDto.category !== undefined) updateData.category = updateMealDto.category;
      if (updateMealDto.date !== undefined) updateData.date = new Date(updateMealDto.date);
      if (updateMealDto.time !== undefined) updateData.time = updateMealDto.time;
      if (updateMealDto.notes !== undefined) updateData.notes = updateMealDto.notes;

      // Auto-categorize if time changed but category not provided
      if (updateMealDto.time && !updateMealDto.category) {
        updateData.category = this.autoCategorizeByTime(updateMealDto.time);
      }

      // Update meal
      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Meal, id, updateData);
      }

      // Update food entries if provided
      if (updateMealDto.foods) {
        await this.updateFoodEntries(queryRunner, id, updateMealDto.foods);
      }

      await queryRunner.commitTransaction();

      // Return updated meal with food entries
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update meal ${id}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a meal
   */
  async remove(id: string): Promise<void> {
    const meal = await this.findOne(id, false);
    await this.mealsRepository.remove(meal);
    this.logger.log(`Meal ${id} deleted successfully`);
  }

  /**
   * Get meal statistics
   */
  async getStats(query: MealStatsQueryDto): Promise<MealStats> {
    const { startDate, endDate, category } = query;

    const queryBuilder = this.mealsRepository.createQueryBuilder('meal')
      .leftJoinAndSelect('meal.foods', 'foods')
      .leftJoinAndSelect('foods.food', 'food');

    if (startDate && endDate) {
      queryBuilder.andWhere('meal.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (category) {
      queryBuilder.andWhere('meal.category = :category', { category });
    }

    const meals = await queryBuilder.getMany();

    if (meals.length === 0) {
      return {
        totalMeals: 0,
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
        mostCommonCategory: MealCategory.SNACK,
        dateRange: {
          start: startDate || '',
          end: endDate || '',
        },
      };
    }

    // Calculate averages
    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
    const totalFat = meals.reduce((sum, meal) => sum + meal.totalFat, 0);

    // Find most common category
    const categoryCount = meals.reduce((acc, meal) => {
      acc[meal.category] = (acc[meal.category] || 0) + 1;
      return acc;
    }, {} as Record<MealCategory, number>);

    const mostCommonCategory = Object.entries(categoryCount).reduce((a, b) =>
      categoryCount[a[0] as MealCategory] > categoryCount[b[0] as MealCategory] ? a : b
    )[0] as MealCategory;

    return {
      totalMeals: meals.length,
      averageCalories: Math.round(totalCalories / meals.length),
      averageProtein: Math.round(totalProtein / meals.length),
      averageCarbs: Math.round(totalCarbs / meals.length),
      averageFat: Math.round(totalFat / meals.length),
      mostCommonCategory,
      dateRange: {
        start: startDate || '',
        end: endDate || '',
      },
    };
  }

  /**
   * Auto-categorize meal by time
   */
  private autoCategorizeByTime(time: string): MealCategory {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Default time ranges (customizable in future)
    const ranges = {
      breakfast: { start: 5 * 60, end: 11 * 60 }, // 5:00 - 11:00
      lunch: { start: 11 * 60, end: 16 * 60 },     // 11:00 - 16:00
      dinner: { start: 16 * 60, end: 22 * 60 },    // 16:00 - 22:00
    };

    if (totalMinutes >= ranges.breakfast.start && totalMinutes < ranges.breakfast.end) {
      return MealCategory.BREAKFAST;
    } else if (totalMinutes >= ranges.lunch.start && totalMinutes < ranges.lunch.end) {
      return MealCategory.LUNCH;
    } else if (totalMinutes >= ranges.dinner.start && totalMinutes < ranges.dinner.end) {
      return MealCategory.DINNER;
    } else {
      return MealCategory.SNACK;
    }
  }

  /**
   * Create food entries for a meal
   */
  private async createFoodEntries(
    queryRunner: QueryRunner,
    mealId: string,
    foodDtos: CreateFoodEntryDto[]
  ): Promise<void> {
    for (const foodDto of foodDtos) {
      // Verify food exists
      const food = await queryRunner.manager.findOne(Food, { where: { id: foodDto.foodId } });
      if (!food) {
        throw new BadRequestException(`Food with ID ${foodDto.foodId} not found`);
      }

      const foodEntry = queryRunner.manager.create(FoodEntry, {
        mealId,
        foodId: foodDto.foodId,
        quantity: foodDto.quantity,
        unit: foodDto.unit || 'g',
      });

      await queryRunner.manager.save(foodEntry);
    }
  }

  /**
   * Update food entries for a meal
   */
  private async updateFoodEntries(
    queryRunner: QueryRunner,
    mealId: string,
    foodDtos: UpdateFoodEntryDto[]
  ): Promise<void> {
    // Get existing food entries
    const existingEntries = await queryRunner.manager.find(FoodEntry, {
      where: { mealId },
    });

    const existingIds = existingEntries.map(entry => entry.id);
    const updateIds = foodDtos.filter(dto => dto.id).map(dto => dto.id);
    const newEntries = foodDtos.filter(dto => !dto.id);

    // Remove entries not in update list
    const toRemove = existingIds.filter(id => !updateIds.includes(id));
    if (toRemove.length > 0) {
      await queryRunner.manager.delete(FoodEntry, toRemove);
    }

    // Update existing entries
    for (const foodDto of foodDtos.filter(dto => dto.id)) {
      const updateData: any = {};
      if (foodDto.foodId !== undefined) updateData.foodId = foodDto.foodId;
      if (foodDto.quantity !== undefined) updateData.quantity = foodDto.quantity;
      if (foodDto.unit !== undefined) updateData.unit = foodDto.unit;

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(FoodEntry, foodDto.id, updateData);
      }
    }

    // Create new entries
    for (const foodDto of newEntries) {
      if (!foodDto.foodId || foodDto.quantity === undefined) {
        throw new BadRequestException('New food entries must have foodId and quantity');
      }

      // Verify food exists
      const food = await queryRunner.manager.findOne(Food, { where: { id: foodDto.foodId } });
      if (!food) {
        throw new BadRequestException(`Food with ID ${foodDto.foodId} not found`);
      }

      const foodEntry = queryRunner.manager.create(FoodEntry, {
        mealId,
        foodId: foodDto.foodId,
        quantity: foodDto.quantity,
        unit: foodDto.unit || 'g',
      });

      await queryRunner.manager.save(foodEntry);
    }
  }

  /**
   * Get meal categorization logic and time ranges
   */
  async getCategorization(customRanges?: any): Promise<{
    defaultRanges: any;
    categories: string[];
    logic: string;
  }> {
    const defaultRanges = {
      breakfast: { start: "05:00", end: "11:00" },
      lunch: { start: "11:00", end: "16:00" },
      dinner: { start: "16:00", end: "22:00" },
      snack: "Other times"
    };

    return {
      defaultRanges: customRanges || defaultRanges,
      categories: Object.values(MealCategory),
      logic: "Meals are auto-categorized based on time: Breakfast (5:00-11:00), Lunch (11:00-16:00), Dinner (16:00-22:00), Snack (other times)"
    };
  }
}