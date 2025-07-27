import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, timeout, catchError, retry } from "rxjs";
import { throwError } from "rxjs";
import { FoodSearchResultDto } from "./dto";

@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);
  private readonly baseUrl = "https://world.openfoodfacts.org/api/v0";
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;

  constructor(private httpService: HttpService) {}

  async searchByName(query: string): Promise<FoodSearchResultDto[]> {
    this.logger.log(`Searching OpenFoodFacts for: ${query}`);

    try {
      const sanitizedQuery = this.sanitizeSearchQuery(query);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/cgi/search.pl`, {
            params: {
              search_terms: sanitizedQuery,
              search_simple: 1,
              action: "process",
              json: 1,
              page_size: 10,
              fields:
                "code,product_name,brands,nutriments,image_url,serving_size",
            },
            timeout: this.REQUEST_TIMEOUT,
          })
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            retry(this.MAX_RETRIES),
            catchError((error) => {
              this.logger.error(
                `OpenFoodFacts API error for query "${query}":`,
                error.message,
              );
              return throwError(() => error);
            }),
          ),
      );

      if (!response.data || !response.data.products) {
        this.logger.warn(`No products found for query: ${query}`);
        return [];
      }

      const results = response.data.products
        .map((product: any) => this.mapOpenFoodFactsProduct(product, query))
        .filter(
          (food: FoodSearchResultDto) =>
            food.name && food.name !== "Unknown Product",
        )
        .sort(
          (a: FoodSearchResultDto, b: FoodSearchResultDto) =>
            (b.confidence || 0) - (a.confidence || 0),
        );

      this.logger.log(`Found ${results.length} products for query: ${query}`);
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to search OpenFoodFacts for "${query}":`,
        error.message,
      );
      throw new Error(`Food search failed: ${error.message}`);
    }
  }

  async searchByBarcode(barcode: string): Promise<FoodSearchResultDto | null> {
    this.logger.log(`Searching OpenFoodFacts by barcode: ${barcode}`);

    try {
      const sanitizedBarcode = this.sanitizeBarcode(barcode);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/product/${sanitizedBarcode}.json`, {
            params: {
              fields:
                "code,product_name,brands,nutriments,image_url,serving_size",
            },
            timeout: this.REQUEST_TIMEOUT,
          })
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            retry(this.MAX_RETRIES),
            catchError((error) => {
              this.logger.error(
                `OpenFoodFacts API error for barcode "${barcode}":`,
                error.message,
              );
              return throwError(() => error);
            }),
          ),
      );

      if (response.data.status === 1 && response.data.product) {
        const result = this.mapOpenFoodFactsProduct(
          response.data.product,
          sanitizedBarcode,
        );
        this.logger.log(`Found product by barcode ${barcode}: ${result.name}`);
        return result;
      }

      this.logger.warn(`No product found for barcode: ${barcode}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch product by barcode "${barcode}":`,
        error.message,
      );
      throw new Error(`Barcode search failed: ${error.message}`);
    }
  }

  private mapOpenFoodFactsProduct(
    product: any,
    searchTerm?: string,
  ): FoodSearchResultDto {
    const nutriments = product.nutriments || {};

    // Extract and clean product name
    const productName = this.cleanProductName(
      product.product_name || product.generic_name || "Unknown Product",
    );
    const brand = this.cleanBrand(product.brands);

    // Normalize nutrition values
    const nutritionData = this.normalizeNutrition(nutriments);

    // Calculate confidence score for search relevance
    const confidence = searchTerm
      ? this.calculateConfidence(productName, brand, searchTerm)
      : 1.0;

    return {
      name: productName,
      brand: brand,
      barcode: product.code || "",
      calories: nutritionData.calories,
      protein: nutritionData.protein,
      carbs: nutritionData.carbs,
      fat: nutritionData.fat,
      fiber: nutritionData.fiber,
      sugar: nutritionData.sugar,
      sodium: nutritionData.sodium,
      servingSize: product.serving_size || "100g",
      imageUrl: this.cleanImageUrl(product.image_url),
      isFromCache: false,
      confidence,
    };
  }

  private sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[^\w\s-]/g, "")
      .substring(0, 100);
  }

  private sanitizeBarcode(barcode: string): string {
    return barcode.replace(/[^0-9]/g, "");
  }

  private cleanProductName(name: string): string {
    if (!name || name === "Unknown Product") return "Unknown Product";
    return name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
      .substring(0, 200);
  }

  private cleanBrand(brands: string): string {
    if (!brands) return "";
    return brands.split(",")[0].trim().substring(0, 100);
  }

  private cleanImageUrl(url: string): string | undefined {
    if (!url || !url.startsWith("http")) return undefined;
    return url.substring(0, 500);
  }

  private normalizeNutrition(nutriments: any): any {
    const getValue = (key: string): number => {
      const value = nutriments[key];
      if (value === undefined || value === null || isNaN(value)) return 0;
      const num = parseFloat(value);
      return num < 0 ? 0 : Math.min(num, 9999); // Cap at reasonable max
    };

    return {
      calories:
        getValue("energy-kcal_100g") || getValue("energy_100g") / 4.184 || 0,
      protein: getValue("proteins_100g"),
      carbs: getValue("carbohydrates_100g"),
      fat: getValue("fat_100g"),
      fiber: getValue("fiber_100g"),
      sugar: getValue("sugars_100g"),
      sodium: getValue("sodium_100g") * 1000, // Convert g to mg
    };
  }

  private calculateConfidence(
    productName: string,
    brand: string,
    searchTerm: string,
  ): number {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const lowerProductName = productName.toLowerCase();
    const lowerBrand = brand?.toLowerCase() || "";

    let confidence = 0;

    // Exact name match
    if (lowerProductName === lowerSearchTerm) {
      confidence += 1.0;
    }
    // Name starts with search term
    else if (lowerProductName.startsWith(lowerSearchTerm)) {
      confidence += 0.8;
    }
    // Name contains search term
    else if (lowerProductName.includes(lowerSearchTerm)) {
      confidence += 0.6;
    }

    // Brand match bonus
    if (lowerBrand && lowerBrand.includes(lowerSearchTerm)) {
      confidence += 0.2;
    }

    // Word match bonus
    const searchWords = lowerSearchTerm.split(" ");
    const nameWords = lowerProductName.split(" ");
    const matchingWords = searchWords.filter((word) =>
      nameWords.some((nameWord) => nameWord.includes(word)),
    );
    confidence += (matchingWords.length / searchWords.length) * 0.3;

    return Math.min(confidence, 1.0);
  }
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: any[];
  skip: number;
}

interface OpenFoodFactsProductResponse {
  code: string;
  product?: any;
  status: number;
  status_verbose: string;
}
