import { Injectable } from "@nestjs/common";
import { OpenFoodFactsService } from "./open-food-facts.service";
import { FoodCacheService } from "./food-cache.service";

@Injectable()
export class FoodsHealthService {
  constructor(
    private openFoodFactsService: OpenFoodFactsService,
    private foodCacheService: FoodCacheService,
  ) {}

  async getHealthStatus(): Promise<any> {
    try {
      // Test OpenFoodFacts API connectivity
      const apiTest = await this.testApiConnectivity();

      // Get cache statistics
      const cacheStats = await this.foodCacheService.getCacheStats();

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          openFoodFactsApi: apiTest,
          cache: {
            ...cacheStats,
            status: "operational",
          },
        },
      };
    } catch (error) {
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async testApiConnectivity(): Promise<any> {
    try {
      // Try searching for a common test product
      const testResult =
        await this.openFoodFactsService.searchByBarcode("8901030895390"); // Maggi noodles

      return {
        status: testResult ? "operational" : "degraded",
        lastTested: new Date().toISOString(),
        testResult: testResult ? "found_test_product" : "no_test_result",
      };
    } catch (error) {
      return {
        status: "error",
        lastTested: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
