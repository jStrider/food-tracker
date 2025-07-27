// Import types for interfaces
import type { 
  Food, 
  Meal, 
  DailyNutrition, 
  MealFilterParams
} from '../types';
import type { 
  CreateFoodDto,
  UpdateFoodDto,
  CreateMealDto,
  UpdateMealDto
} from '../dtos';

// Service interfaces
export interface IFoodService {
  searchByName(query: string): Promise<Food[]>;
  searchByBarcode(barcode: string): Promise<Food | null>;
  findAll(): Promise<Food[]>;
  findOne(id: string): Promise<Food | null>;
  create(food: CreateFoodDto): Promise<Food>;
  update(id: string, food: UpdateFoodDto): Promise<Food>;
  delete(id: string): Promise<void>;
}

export interface IMealService {
  findAll(date?: string): Promise<Meal[]>;
  findOne(id: string): Promise<Meal | null>;
  create(meal: CreateMealDto): Promise<Meal>;
  update(id: string, meal: UpdateMealDto): Promise<Meal>;
  delete(id: string): Promise<void>;
}

export interface INutritionService {
  getDailyNutrition(date: string): Promise<DailyNutrition>;
  getWeeklyNutrition(startDate: string): Promise<DailyNutrition[]>;
  getMonthlyNutrition(month: number, year: number): Promise<DailyNutrition[]>;
}

// Repository interfaces
export interface IFoodRepository {
  findAll(): Promise<Food[]>;
  findById(id: string): Promise<Food | null>;
  findByBarcode(barcode: string): Promise<Food | null>;
  search(query: string): Promise<Food[]>;
  save(food: Food): Promise<Food>;
  delete(id: string): Promise<void>;
}

export interface IMealRepository {
  findAll(filters?: MealFilterParams): Promise<Meal[]>;
  findById(id: string): Promise<Meal | null>;
  findByDate(date: string): Promise<Meal[]>;
  save(meal: Meal): Promise<Meal>;
  delete(id: string): Promise<void>;
}

// External API interfaces
export interface IOpenFoodFactsService {
  searchByName(query: string): Promise<Food[]>;
  searchByBarcode(barcode: string): Promise<Food | null>;
}

// MCP Tool interfaces
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface IMcpService {
  getAvailableTools(): { tools: McpTool[] };
  callTool(toolName: string, params: any): Promise<any>;
  getAvailableResources(): { resources: McpResource[] };
  getResource(resourceUri: string): Promise<any>;
}

