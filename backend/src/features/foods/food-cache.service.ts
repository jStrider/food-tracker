import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { Food } from "./entities/food.entity";
import { FoodSearchResultDto } from "./dto";

@Injectable()
export class FoodCacheService {
  private readonly logger = new Logger(FoodCacheService.name);
  private readonly CACHE_RETENTION_DAYS = 30;
  private readonly MIN_USAGE_COUNT = 1;

  constructor(
    @InjectRepository(Food)
    private foodsRepository: Repository<Food>,
  ) {}

  /**
   * Get frequently used foods (optimization for UI suggestions)
   */
  async getFrequentlyUsedFoods(limit: number = 20): Promise<Food[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_RETENTION_DAYS);

    return this.foodsRepository.find({
      where: {
        updatedAt: MoreThan(cutoffDate),
      },
      order: {
        updatedAt: "DESC",
      },
      take: limit,
    });
  }

  /**
   * Update food usage (touch updatedAt when food is used)
   */
  async markFoodAsUsed(foodId: string): Promise<void> {
    try {
      await this.foodsRepository.update(foodId, {
        updatedAt: new Date(),
      });
      this.logger.debug(`Marked food ${foodId} as recently used`);
    } catch (error) {
      this.logger.warn(`Failed to mark food ${foodId} as used:`, error.message);
    }
  }

  /**
   * Clean up old cached foods that haven't been used recently
   */
  async cleanupOldCache(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CACHE_RETENTION_DAYS);

    try {
      // Find foods that are old and have no associated food entries
      const oldFoods = await this.foodsRepository
        .createQueryBuilder("food")
        .leftJoin("food_entries", "fe", "fe.foodId = food.id")
        .where("food.updatedAt < :cutoffDate", { cutoffDate })
        .andWhere("fe.id IS NULL") // No food entries reference this food
        .getMany();

      if (oldFoods.length === 0) {
        this.logger.log("No old foods to clean up");
        return 0;
      }

      const foodIds = oldFoods.map((food) => food.id);
      const result = await this.foodsRepository.delete(foodIds);

      this.logger.log(`Cleaned up ${result.affected} old cached foods`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error("Failed to cleanup old cache:", error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const total = await this.foodsRepository.count();

      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - 7);

      const recentlyUsed = await this.foodsRepository.count({
        where: {
          updatedAt: MoreThan(recentCutoff),
        },
      });

      const withBarcode = await this.foodsRepository.count({
        where: {
          barcode: MoreThan(""),
        },
      });

      return {
        totalCachedFoods: total,
        recentlyUsedFoods: recentlyUsed,
        foodsWithBarcode: withBarcode,
        cacheHitRate: total > 0 ? (recentlyUsed / total) * 100 : 0,
      };
    } catch (error) {
      this.logger.error("Failed to get cache stats:", error.message);
      return {
        totalCachedFoods: 0,
        recentlyUsedFoods: 0,
        foodsWithBarcode: 0,
        cacheHitRate: 0,
      };
    }
  }

  /**
   * Check if a food should be cached based on quality criteria
   */
  shouldCacheFood(food: FoodSearchResultDto): boolean {
    // Don't cache foods with insufficient nutrition data
    if (!food.name || food.name === "Unknown Product") {
      return false;
    }

    // Don't cache foods with zero calories and zero macros (likely incomplete data)
    const hasNutritionData =
      food.calories > 0 || food.protein > 0 || food.carbs > 0 || food.fat > 0;

    // Don't cache foods with very low confidence scores
    const hasGoodConfidence = !food.confidence || food.confidence >= 0.3;

    return hasNutritionData && hasGoodConfidence;
  }

  /**
   * Optimize cache by keeping most relevant foods
   */
  async optimizeCache(): Promise<void> {
    try {
      const stats = await this.getCacheStats();
      this.logger.log(`Cache optimization started. Current stats:`, stats);

      // Clean up old unused foods
      const cleanedCount = await this.cleanupOldCache();

      // Additional optimization could include:
      // - Removing duplicate foods with same name/brand
      // - Prioritizing foods with barcodes
      // - Keeping foods with better nutrition data

      this.logger.log(
        `Cache optimization completed. Cleaned ${cleanedCount} foods.`,
      );
    } catch (error) {
      this.logger.error("Cache optimization failed:", error.message);
    }
  }
}

export interface CacheStats {
  totalCachedFoods: number;
  recentlyUsedFoods: number;
  foodsWithBarcode: number;
  cacheHitRate: number;
}
