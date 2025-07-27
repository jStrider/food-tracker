import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { FoodsService } from "./foods.service";
import { FoodCacheService, CacheStats } from "./food-cache.service";
import { FoodsHealthService } from "./foods.health";
import {
  CreateFoodDto,
  UpdateFoodDto,
  CreateFoodEntryDto,
  UpdateFoodEntryDto,
  SearchFoodDto,
} from "./dto";

@Controller("foods")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FoodsController {
  constructor(
    private readonly foodsService: FoodsService,
    private readonly foodCacheService: FoodCacheService,
    private readonly foodsHealthService: FoodsHealthService,
  ) {}

  @Get("search")
  searchFoods(@Query("q") query?: string, @Query("barcode") barcode?: string) {
    if (!query && !barcode) {
      throw new BadRequestException(
        "Either query (q) or barcode parameter is required",
      );
    }

    if (barcode) {
      if (barcode.length < 8 || barcode.length > 13) {
        throw new BadRequestException(
          "Barcode must be between 8 and 13 digits",
        );
      }
      return this.foodsService.searchByBarcode(barcode);
    }

    if (query.length < 2) {
      throw new BadRequestException(
        "Search query must be at least 2 characters long",
      );
    }

    return this.foodsService.searchByName(query);
  }

  @Get()
  findAll() {
    return this.foodsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.foodsService.findOne(id);
  }

  @Post()
  create(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.create(createFoodDto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateFoodDto: UpdateFoodDto) {
    return this.foodsService.update(id, updateFoodDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.foodsService.remove(id);
  }

  // Food entries management
  @Post(":mealId/entries")
  addFoodToMeal(
    @Param("mealId") mealId: string,
    @Body() createFoodEntryDto: CreateFoodEntryDto,
  ) {
    return this.foodsService.addFoodToMeal(mealId, createFoodEntryDto);
  }

  @Put("entries/:entryId")
  updateFoodEntry(
    @Param("entryId") entryId: string,
    @Body() updateFoodEntryDto: UpdateFoodEntryDto,
  ) {
    return this.foodsService.updateFoodEntry(entryId, updateFoodEntryDto);
  }

  @Delete("entries/:entryId")
  removeFoodEntry(@Param("entryId") entryId: string) {
    return this.foodsService.removeFoodEntry(entryId);
  }

  // Cache management endpoints
  @Get("cache/stats")
  getCacheStats(): Promise<CacheStats> {
    return this.foodCacheService.getCacheStats();
  }

  @Get("cache/frequent")
  getFrequentlyUsedFoods(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (limitNum > 100) {
      throw new BadRequestException("Limit cannot exceed 100");
    }
    return this.foodCacheService.getFrequentlyUsedFoods(limitNum);
  }

  @Post("cache/cleanup")
  cleanupCache() {
    return this.foodCacheService.cleanupOldCache();
  }

  @Post("cache/optimize")
  optimizeCache() {
    return this.foodCacheService.optimizeCache();
  }

  @Post(":id/mark-used")
  markFoodAsUsed(@Param("id") id: string) {
    return this.foodCacheService.markFoodAsUsed(id);
  }

  // Health check endpoint
  @Get("health")
  getHealthStatus() {
    return this.foodsHealthService.getHealthStatus();
  }
}
