import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Food } from "./entities/food.entity";
import { FoodEntry } from "./entities/food-entry.entity";
import { OpenFoodFactsService } from "./open-food-facts.service";
import { FoodCacheService } from "./food-cache.service";
import {
  CreateFoodDto,
  UpdateFoodDto,
  CreateFoodEntryDto,
  UpdateFoodEntryDto,
  FoodSearchResultDto,
} from "./dto";

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name);
  private readonly CACHE_THRESHOLD = 5; // Minimum local results before searching external API
  private readonly MAX_EXTERNAL_RESULTS = 10;

  constructor(
    @InjectRepository(Food)
    private foodsRepository: Repository<Food>,
    @InjectRepository(FoodEntry)
    private foodEntriesRepository: Repository<FoodEntry>,
    private openFoodFactsService: OpenFoodFactsService,
    private foodCacheService: FoodCacheService,
  ) {}

  async searchByName(query: string): Promise<FoodSearchResultDto[]> {
    this.logger.log(`Searching foods by name: ${query}`);

    try {
      // First search local cache with better matching
      const localFoods = await this.searchLocalFoods(query);
      const localResults = localFoods.map((food) =>
        this.mapFoodToSearchResult(food, true),
      );

      // If not enough results, search OpenFoodFacts
      if (localResults.length < this.CACHE_THRESHOLD) {
        this.logger.log(
          `Local results insufficient (${localResults.length}), searching external API`,
        );

        try {
          const externalResults =
            await this.openFoodFactsService.searchByName(query);

          // Cache promising external foods locally
          const cachedResults =
            await this.cacheExternalResults(externalResults);

          // Combine and deduplicate results
          const combinedResults = this.deduplicateResults([
            ...localResults,
            ...cachedResults,
          ]);

          this.logger.log(
            `Combined search returned ${combinedResults.length} results`,
          );
          return combinedResults;
        } catch (externalError) {
          this.logger.warn(
            `External search failed, returning local results only: ${externalError.message}`,
          );
          return localResults;
        }
      }

      this.logger.log(`Returning ${localResults.length} local results`);
      return localResults;
    } catch (error) {
      this.logger.error(
        `Food search failed for query "${query}":`,
        error.message,
      );
      throw new Error(`Food search failed: ${error.message}`);
    }
  }

  async searchByBarcode(barcode: string): Promise<FoodSearchResultDto | null> {
    this.logger.log(`Searching foods by barcode: ${barcode}`);

    try {
      // First check local cache
      const food = await this.foodsRepository.findOne({ where: { barcode } });

      if (food) {
        this.logger.log(`Found food in local cache: ${food.name}`);
        return this.mapFoodToSearchResult(food, true);
      }

      // Search OpenFoodFacts
      this.logger.log(`Food not in cache, searching external API`);
      const externalResult =
        await this.openFoodFactsService.searchByBarcode(barcode);

      if (externalResult) {
        // Cache the food locally
        const cachedFood = await this.cacheFood(externalResult);
        this.logger.log(
          `Cached new food from external API: ${cachedFood.name}`,
        );
        return this.mapFoodToSearchResult(cachedFood, false);
      }

      this.logger.warn(`No food found for barcode: ${barcode}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Barcode search failed for "${barcode}":`,
        error.message,
      );
      throw new Error(`Barcode search failed: ${error.message}`);
    }
  }

  async findAll(): Promise<Food[]> {
    return this.foodsRepository.find();
  }

  async findOne(id: string): Promise<Food> {
    const food = await this.foodsRepository.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`Food with ID ${id} not found`);
    }
    return food;
  }

  async create(createFoodDto: CreateFoodDto): Promise<Food> {
    const food = this.foodsRepository.create(createFoodDto);
    return this.foodsRepository.save(food);
  }

  async update(id: string, updateFoodDto: UpdateFoodDto): Promise<Food> {
    const existingFood = await this.findOne(id); // This will throw if not found
    await this.foodsRepository.update(id, updateFoodDto);
    this.logger.log(`Updated food: ${existingFood.name}`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.foodsRepository.delete(id);
  }

  // Food entries management
  async addFoodToMeal(
    mealId: string,
    createFoodEntryDto: CreateFoodEntryDto,
  ): Promise<FoodEntry> {
    // Verify food exists
    await this.findOne(createFoodEntryDto.foodId);

    const foodEntry = this.foodEntriesRepository.create({
      ...createFoodEntryDto,
      mealId,
    });

    const savedEntry = await this.foodEntriesRepository.save(foodEntry);
    this.logger.log(
      `Added food entry: ${createFoodEntryDto.quantity}${createFoodEntryDto.unit} to meal ${mealId}`,
    );
    return savedEntry;
  }

  async updateFoodEntry(
    entryId: string,
    updateFoodEntryDto: UpdateFoodEntryDto,
  ): Promise<FoodEntry> {
    const existingEntry = await this.foodEntriesRepository.findOne({
      where: { id: entryId },
    });
    if (!existingEntry) {
      throw new NotFoundException(`Food entry with ID ${entryId} not found`);
    }

    await this.foodEntriesRepository.update(entryId, updateFoodEntryDto);
    this.logger.log(`Updated food entry: ${entryId}`);
    return this.foodEntriesRepository.findOne({ where: { id: entryId } });
  }

  async removeFoodEntry(entryId: string): Promise<void> {
    const result = await this.foodEntriesRepository.delete(entryId);
    if (result.affected === 0) {
      throw new NotFoundException(`Food entry with ID ${entryId} not found`);
    }
    this.logger.log(`Removed food entry: ${entryId}`);
  }

  private async searchLocalFoods(query: string): Promise<Food[]> {
    return this.foodsRepository.find({
      where: [{ name: ILike(`%${query}%`) }, { brand: ILike(`%${query}%`) }],
      order: { name: "ASC" },
      take: 20,
    });
  }

  private mapFoodToSearchResult(
    food: Food,
    isFromCache: boolean,
  ): FoodSearchResultDto {
    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium,
      servingSize: food.servingSize,
      imageUrl: food.imageUrl,
      isFromCache,
      confidence: 1.0, // Local results are considered fully relevant
    };
  }

  private async cacheExternalResults(
    externalResults: FoodSearchResultDto[],
  ): Promise<FoodSearchResultDto[]> {
    const cachedResults: FoodSearchResultDto[] = [];

    for (const result of externalResults.slice(0, this.MAX_EXTERNAL_RESULTS)) {
      // Check if food should be cached based on quality criteria
      if (!this.foodCacheService.shouldCacheFood(result)) {
        this.logger.debug(
          `Skipping cache for low quality food: ${result.name}`,
        );
        cachedResults.push(result);
        continue;
      }

      try {
        const cachedFood = await this.cacheFood(result);
        cachedResults.push({
          ...result,
          id: cachedFood.id,
          isFromCache: false, // Just cached, mark as external
        });
      } catch (error) {
        this.logger.warn(`Failed to cache food ${result.name}:`, error.message);
        // Include uncached result anyway
        cachedResults.push(result);
      }
    }

    return cachedResults;
  }

  private deduplicateResults(
    results: FoodSearchResultDto[],
  ): FoodSearchResultDto[] {
    const seen = new Set<string>();
    const deduplicated: FoodSearchResultDto[] = [];

    for (const result of results) {
      const key = result.barcode || `${result.name}-${result.brand}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }

    return deduplicated.sort((a, b) => {
      // Prioritize cache results, then by confidence
      if (a.isFromCache && !b.isFromCache) return -1;
      if (!a.isFromCache && b.isFromCache) return 1;
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }

  private async cacheFood(
    foodData: Partial<Food> | FoodSearchResultDto,
  ): Promise<Food> {
    // Check if already exists by barcode or name+brand combination
    let existingFood: Food | null = null;

    if (foodData.barcode) {
      existingFood = await this.foodsRepository.findOne({
        where: { barcode: foodData.barcode },
      });
    }

    if (!existingFood && foodData.name) {
      existingFood = await this.foodsRepository.findOne({
        where: {
          name: foodData.name,
          brand: foodData.brand || "",
        },
      });
    }

    if (existingFood) {
      this.logger.debug(`Food already cached: ${existingFood.name}`);
      return existingFood;
    }

    // Create new food entry
    const newFood = this.foodsRepository.create({
      name: foodData.name || "Unknown Product",
      brand: foodData.brand || "",
      barcode: foodData.barcode || "",
      calories: foodData.calories || 0,
      protein: foodData.protein || 0,
      carbs: foodData.carbs || 0,
      fat: foodData.fat || 0,
      fiber: foodData.fiber || 0,
      sugar: foodData.sugar || 0,
      sodium: foodData.sodium || 0,
      servingSize: foodData.servingSize || "100g",
      imageUrl: foodData.imageUrl,
    });

    const savedFood = await this.foodsRepository.save(newFood);
    this.logger.debug(`Cached new food: ${savedFood.name}`);
    return savedFood;
  }
}

interface CacheSearchOptions {
  includeExternal: boolean;
  maxResults: number;
  confidenceThreshold: number;
}
