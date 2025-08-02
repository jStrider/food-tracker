import { Injectable } from "@nestjs/common";
import {
  MealsService,
  MealFilterOptions,
} from "../features/meals/meals.service";
import { FoodsService } from "../features/foods/foods.service";
import {
  NutritionService,
  NutritionGoals,
} from "../features/nutrition/nutrition.service";

@Injectable()
export class McpService {
  constructor(
    private mealsService: MealsService,
    private foodsService: FoodsService,
    private nutritionService: NutritionService,
  ) {}

  getAvailableTools() {
    return {
      tools: [
        // Meal CRUD operations
        {
          name: "get_meals",
          description:
            "Get meals with optional filtering by date, date range, or category",
          inputSchema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Specific date in YYYY-MM-DD format",
              },
              startDate: {
                type: "string",
                description: "Start date for range in YYYY-MM-DD format",
              },
              endDate: {
                type: "string",
                description: "End date for range in YYYY-MM-DD format",
              },
              category: {
                type: "string",
                enum: ["breakfast", "lunch", "dinner", "snack"],
              },
            },
          },
        },
        {
          name: "get_meal",
          description: "Get a specific meal by ID",
          inputSchema: {
            type: "object",
            properties: {
              mealId: { type: "string" },
            },
            required: ["mealId"],
          },
        },
        {
          name: "create_meal",
          description:
            "Create a new meal with auto-categorization if category not provided",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: {
                type: "string",
                enum: ["breakfast", "lunch", "dinner", "snack"],
              },
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format",
              },
              time: {
                type: "string",
                description:
                  "Time in HH:MM format (24-hour). If provided, will be used for auto-categorization",
              },
            },
            required: ["name", "date"],
          },
        },
        {
          name: "update_meal",
          description: "Update an existing meal",
          inputSchema: {
            type: "object",
            properties: {
              mealId: { type: "string" },
              name: { type: "string" },
              category: {
                type: "string",
                enum: ["breakfast", "lunch", "dinner", "snack"],
              },
              date: { type: "string" },
              time: {
                type: "string",
                description:
                  "Time in HH:MM format (24-hour). If provided, will be used for auto-categorization if category not specified",
              },
            },
            required: ["mealId"],
          },
        },
        {
          name: "delete_meal",
          description: "Delete a meal by ID",
          inputSchema: {
            type: "object",
            properties: {
              mealId: { type: "string" },
            },
            required: ["mealId"],
          },
        },

        // Food CRUD operations
        {
          name: "search_foods",
          description:
            "Search for foods by name or barcode from local cache and OpenFoodFacts",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Food name to search for" },
              barcode: { type: "string", description: "Barcode to search for" },
            },
          },
        },
        {
          name: "get_foods",
          description: "Get all foods from local database",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_food",
          description: "Get a specific food by ID",
          inputSchema: {
            type: "object",
            properties: {
              foodId: { type: "string" },
            },
            required: ["foodId"],
          },
        },
        {
          name: "create_food",
          description: "Create a new food item",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              brand: { type: "string" },
              barcode: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              fiber: { type: "number" },
              sugar: { type: "number" },
              sodium: { type: "number" },
              servingSize: { type: "string" },
              imageUrl: { type: "string" },
            },
            required: ["name", "calories", "protein", "carbs", "fat"],
          },
        },
        {
          name: "update_food",
          description: "Update an existing food item",
          inputSchema: {
            type: "object",
            properties: {
              foodId: { type: "string" },
              name: { type: "string" },
              brand: { type: "string" },
              barcode: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              fiber: { type: "number" },
              sugar: { type: "number" },
              sodium: { type: "number" },
              servingSize: { type: "string" },
              imageUrl: { type: "string" },
            },
            required: ["foodId"],
          },
        },
        {
          name: "delete_food",
          description: "Delete a food item by ID",
          inputSchema: {
            type: "object",
            properties: {
              foodId: { type: "string" },
            },
            required: ["foodId"],
          },
        },

        // Food entry operations
        {
          name: "add_food_to_meal",
          description: "Add a food item to a meal with specified quantity",
          inputSchema: {
            type: "object",
            properties: {
              mealId: { type: "string" },
              foodId: { type: "string" },
              quantity: { type: "number", description: "Quantity in grams" },
              unit: { type: "string", default: "g" },
            },
            required: ["mealId", "foodId", "quantity"],
          },
        },
        {
          name: "update_food_entry",
          description: "Update a food entry in a meal",
          inputSchema: {
            type: "object",
            properties: {
              entryId: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
            },
            required: ["entryId"],
          },
        },
        {
          name: "remove_food_from_meal",
          description: "Remove a food entry from a meal",
          inputSchema: {
            type: "object",
            properties: {
              entryId: { type: "string" },
            },
            required: ["entryId"],
          },
        },

        // Nutrition tracking
        {
          name: "get_daily_nutrition",
          description: "Get nutrition summary for a specific date",
          inputSchema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format",
              },
            },
            required: ["date"],
          },
        },
        {
          name: "get_meal_nutrition",
          description: "Get nutrition summary for a specific meal",
          inputSchema: {
            type: "object",
            properties: {
              mealId: { type: "string" },
            },
            required: ["mealId"],
          },
        },
        {
          name: "get_weekly_nutrition",
          description: "Get weekly nutrition summary starting from a date",
          inputSchema: {
            type: "object",
            properties: {
              startDate: {
                type: "string",
                description: "Start date in YYYY-MM-DD format",
              },
            },
            required: ["startDate"],
          },
        },
        {
          name: "get_monthly_nutrition",
          description: "Get monthly nutrition data",
          inputSchema: {
            type: "object",
            properties: {
              month: { type: "number", description: "Month (1-12)" },
              year: { type: "number", description: "Year" },
            },
            required: ["month", "year"],
          },
        },
        {
          name: "compare_to_goals",
          description: "Compare daily nutrition to goals",
          inputSchema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date in YYYY-MM-DD format",
              },
              goals: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  fiber: { type: "number" },
                  sodium: { type: "number" },
                },
                required: ["calories", "protein", "carbs", "fat"],
              },
            },
            required: ["date", "goals"],
          },
        },
        {
          name: "get_macro_breakdown",
          description:
            "Get macronutrient breakdown percentages for nutrition data",
          inputSchema: {
            type: "object",
            properties: {
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              fiber: { type: "number" },
              sugar: { type: "number" },
              sodium: { type: "number" },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
        },

        // Utility operations
        {
          name: "get_meal_categorization",
          description:
            "Get current meal categorization time ranges or test custom ranges",
          inputSchema: {
            type: "object",
            properties: {
              customRanges: {
                type: "object",
                properties: {
                  breakfast: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" },
                    },
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" },
                    },
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };
  }

  async callTool(toolName: string, params: any) {
    try {
      switch (toolName) {
        // Meal CRUD operations
        case "get_meals":
          const filters: MealFilterOptions = {};
          if (params.date) filters.date = params.date;
          if (params.startDate) filters.startDate = params.startDate;
          if (params.endDate) filters.endDate = params.endDate;
          if (params.category) filters.category = params.category;
          return this.mealsService.findAll(filters);

        case "get_meal":
          return this.mealsService.findOne(params.mealId);

        case "create_meal":
          return this.mealsService.create(params);

        case "update_meal":
          const { mealId, ...updateData } = params;
          return this.mealsService.update(mealId, updateData);

        case "delete_meal":
          await this.mealsService.remove(params.mealId);
          return { success: true, message: "Meal deleted successfully" };

        // Food CRUD operations
        case "search_foods":
          if (params.barcode) {
            const food = await this.foodsService.searchByBarcode(
              params.barcode,
            );
            return food ? [food] : [];
          }
          return this.foodsService.searchByName(params.query);

        case "get_foods":
          return this.foodsService.findAll();

        case "get_food":
          return this.foodsService.findOne(params.foodId);

        case "create_food":
          return this.foodsService.create(params);

        case "update_food":
          const { foodId, ...foodUpdateData } = params;
          return this.foodsService.update(foodId, foodUpdateData);

        case "delete_food":
          await this.foodsService.remove(params.foodId);
          return { success: true, message: "Food deleted successfully" };

        // Food entry operations
        case "add_food_to_meal":
          return this.foodsService.addFoodToMeal(params.mealId, {
            foodId: params.foodId,
            quantity: params.quantity,
            unit: params.unit || "g",
          });

        case "update_food_entry":
          const { entryId, ...entryUpdateData } = params;
          return this.foodsService.updateFoodEntry(entryId, entryUpdateData);

        case "remove_food_from_meal":
          await this.foodsService.removeFoodEntry(params.entryId);
          return { success: true, message: "Food entry removed successfully" };

        // Nutrition tracking
        case "get_daily_nutrition":
          return this.nutritionService.getDailyNutrition(params.date, 'default-user');

        case "get_meal_nutrition":
          return this.nutritionService.getMealNutrition(params.mealId, 'default-user');

        case "get_weekly_nutrition":
          return this.nutritionService.getWeeklyNutrition(params.startDate, 'default-user');

        case "get_monthly_nutrition":
          return this.nutritionService.getMonthlyNutrition(
            params.month,
            params.year,
            'default-user',
          );

        case "compare_to_goals":
          return this.nutritionService.compareToGoals(
            params.date,
            params.goals,
            'default-user',
          );

        case "get_macro_breakdown":
          return this.nutritionService.getMacroBreakdown(params);

        // Utility operations
        case "get_meal_categorization":
          return this.mealsService.getCategorization(params.customRanges);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      throw new Error(`Error executing tool ${toolName}: ${error.message}`);
    }
  }

  getAvailableResources() {
    return {
      resources: [
        {
          uri: "foodtracker://meals",
          name: "All Meals",
          description: "Access to all meals in the system with full details",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://meals/today",
          name: "Today's Meals",
          description: "Today's meals with nutrition information",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://foods",
          name: "Food Database",
          description: "Complete local food database cache",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://nutrition/daily",
          name: "Daily Nutrition",
          description: "Today's nutrition summary",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://nutrition/weekly",
          name: "Weekly Nutrition",
          description: "Current week nutrition data",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://nutrition/monthly",
          name: "Monthly Nutrition",
          description: "Current month nutrition data",
          mimeType: "application/json",
        },
        {
          uri: "foodtracker://system/info",
          name: "System Information",
          description: "FoodTracker system capabilities and status",
          mimeType: "application/json",
        },
      ],
    };
  }

  async getResource(resourceUri: string) {
    try {
      const [, resourcePath] = resourceUri.split("://");
      const [resource, subResource] = resourcePath.split("/");

      switch (resource) {
        case "meals":
          if (subResource === "today") {
            const today = new Date().toISOString().split("T")[0];
            return this.mealsService.findAll({ date: today });
          }
          return this.mealsService.findAll({});

        case "foods":
          return this.foodsService.findAll();

        case "nutrition":
          const today = new Date().toISOString().split("T")[0];
          if (subResource === "daily") {
            return this.nutritionService.getDailyNutrition(today, 'default-user');
          } else if (subResource === "weekly") {
            return this.nutritionService.getWeeklyNutrition(today, 'default-user');
          } else if (subResource === "monthly") {
            const now = new Date();
            return this.nutritionService.getMonthlyNutrition(
              now.getMonth() + 1,
              now.getFullYear(),
              'default-user',
            );
          }
          // Default to weekly if no subResource
          return this.nutritionService.getWeeklyNutrition(today, 'default-user');

        case "system":
          if (subResource === "info") {
            return {
              name: "FoodTracker Backend",
              version: "1.0.0",
              description:
                "Complete nutrition tracking system with OpenFoodFacts integration",
              capabilities: {
                meals: "Full CRUD with auto-categorization",
                foods: "Local cache + OpenFoodFacts API integration",
                nutrition: "Comprehensive macro tracking and analysis",
                mcp: "Full MCP server with 20+ tools",
              },
              database: "SQLite",
              features: [
                "Auto meal categorization by time",
                "OpenFoodFacts API integration",
                "Barcode scanning support",
                "Daily/weekly/monthly nutrition summaries",
                "Nutrition goal tracking",
                "Macro breakdown analysis",
                "Complete MCP server for Claude integration",
              ],
              endpoints: {
                meals: "/api/meals",
                foods: "/api/foods",
                nutrition: "/api/nutrition",
                mcp: "/api/mcp",
              },
            };
          }
          throw new Error(`Unknown system resource: ${subResource}`);

        default:
          throw new Error(`Unknown resource: ${resource}`);
      }
    } catch (error) {
      throw new Error(
        `Error fetching resource ${resourceUri}: ${error.message}`,
      );
    }
  }
}
