// Application constants
export const APP_CONFIG = {
  NAME: 'FoodTracker',
  VERSION: '1.0.0',
  DESCRIPTION: 'Macro-nutrients and calories tracking application',
} as const;

// API constants
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000,
} as const;

// Nutrition constants
export const NUTRITION_TARGETS = {
  CALORIES: {
    MIN: 1200,
    MAX: 3500,
    DEFAULT: 2000,
  },
  PROTEIN: {
    MIN_PERCENTAGE: 10,
    MAX_PERCENTAGE: 35,
    DEFAULT_PERCENTAGE: 25,
  },
  CARBS: {
    MIN_PERCENTAGE: 45,
    MAX_PERCENTAGE: 65,
    DEFAULT_PERCENTAGE: 50,
  },
  FAT: {
    MIN_PERCENTAGE: 20,
    MAX_PERCENTAGE: 35,
    DEFAULT_PERCENTAGE: 25,
  },
} as const;

// Meal categories
export const MEAL_CATEGORIES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;

// Units
export const UNITS = {
  WEIGHT: ['g', 'kg', 'oz', 'lb'],
  VOLUME: ['ml', 'l', 'cup', 'tbsp', 'tsp', 'fl oz'],
  PIECE: ['piece', 'slice', 'serving'],
} as const;

// Validation constants
export const VALIDATION = {
  FOOD_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  MEAL_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  QUANTITY: {
    MIN: 0.1,
    MAX: 10000,
  },
  NUTRITION: {
    MIN: 0,
    MAX: 10000,
  },
} as const;

// OpenFoodFacts API constants
export const OPENFOODFACTS = {
  BASE_URL: 'https://world.openfoodfacts.org/api/v0',
  SEARCH_LIMIT: 20,
  TIMEOUT: 10000,
} as const;

// MCP Protocol constants
export const MCP = {
  PROTOCOL_VERSION: '1.0',
  SUPPORTED_TOOLS: [
    'get_meals',
    'create_meal',
    'search_foods',
    'add_food_to_meal',
    'get_daily_nutrition',
  ],
  SUPPORTED_RESOURCES: [
    'foodtracker://meals',
    'foodtracker://foods',
    'foodtracker://nutrition',
  ],
} as const;

// Database constants
export const DATABASE = {
  SQLITE_PATH: 'data/foodtracker.db',
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;