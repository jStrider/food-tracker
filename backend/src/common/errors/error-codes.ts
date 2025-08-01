export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_USER_NOT_FOUND = 'AUTH_004',
  AUTH_USER_ALREADY_EXISTS = 'AUTH_005',
  AUTH_PERMISSION_DENIED = 'AUTH_006',
  AUTH_PASSWORD_TOO_WEAK = 'AUTH_007',
  AUTH_ACCOUNT_LOCKED = 'AUTH_008',

  // Validation
  VALIDATION_FAILED = 'VAL_001',
  VALIDATION_REQUIRED_FIELD = 'VAL_002',
  VALIDATION_INVALID_FORMAT = 'VAL_003',
  VALIDATION_OUT_OF_RANGE = 'VAL_004',
  VALIDATION_DUPLICATE_VALUE = 'VAL_005',

  // User Management
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_PROFILE_INCOMPLETE = 'USER_003',
  USER_DEACTIVATED = 'USER_004',

  // Food & Nutrition
  FOOD_NOT_FOUND = 'FOOD_001',
  FOOD_SEARCH_FAILED = 'FOOD_002',
  FOOD_CACHE_ERROR = 'FOOD_003',
  FOOD_EXTERNAL_API_ERROR = 'FOOD_004',
  NUTRITION_CALCULATION_ERROR = 'NUTR_001',
  NUTRITION_DATA_INCOMPLETE = 'NUTR_002',

  // Meal Management
  MEAL_NOT_FOUND = 'MEAL_001',
  MEAL_INVALID_DATE = 'MEAL_002',
  MEAL_DUPLICATE_ENTRY = 'MEAL_003',
  MEAL_CALCULATION_ERROR = 'MEAL_004',

  // Calendar
  CALENDAR_INVALID_DATE_RANGE = 'CAL_001',
  CALENDAR_DATA_NOT_FOUND = 'CAL_002',

  // Database
  DATABASE_CONNECTION_ERROR = 'DB_001',
  DATABASE_QUERY_ERROR = 'DB_002',
  DATABASE_CONSTRAINT_VIOLATION = 'DB_003',
  DATABASE_TRANSACTION_ERROR = 'DB_004',
  DATABASE_MIGRATION_ERROR = 'DB_005',

  // External Services
  EXTERNAL_API_UNAVAILABLE = 'EXT_001',
  EXTERNAL_API_RATE_LIMITED = 'EXT_002',
  EXTERNAL_API_INVALID_RESPONSE = 'EXT_003',
  EXTERNAL_API_TIMEOUT = 'EXT_004',

  // System
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002',
  CONFIGURATION_ERROR = 'SYS_003',
  FEATURE_NOT_IMPLEMENTED = 'SYS_004',
  RATE_LIMIT_EXCEEDED = 'SYS_005',
  RESOURCE_NOT_FOUND = 'SYS_006',
  OPERATION_TIMEOUT = 'SYS_007',

  // File & Media
  FILE_NOT_FOUND = 'FILE_001',
  FILE_TOO_LARGE = 'FILE_002',
  FILE_INVALID_FORMAT = 'FILE_003',
  FILE_UPLOAD_FAILED = 'FILE_004',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid username or password',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'User not found',
  [ErrorCode.AUTH_USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.AUTH_PERMISSION_DENIED]: 'Permission denied',
  [ErrorCode.AUTH_PASSWORD_TOO_WEAK]: 'Password does not meet security requirements',
  [ErrorCode.AUTH_ACCOUNT_LOCKED]: 'Account is locked due to security reasons',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid data format',
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: 'Value is out of acceptable range',
  [ErrorCode.VALIDATION_DUPLICATE_VALUE]: 'Duplicate value detected',

  // User Management
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_PROFILE_INCOMPLETE]: 'User profile is incomplete',
  [ErrorCode.USER_DEACTIVATED]: 'User account is deactivated',

  // Food & Nutrition
  [ErrorCode.FOOD_NOT_FOUND]: 'Food item not found',
  [ErrorCode.FOOD_SEARCH_FAILED]: 'Food search operation failed',
  [ErrorCode.FOOD_CACHE_ERROR]: 'Food cache operation failed',
  [ErrorCode.FOOD_EXTERNAL_API_ERROR]: 'External food database API error',
  [ErrorCode.NUTRITION_CALCULATION_ERROR]: 'Nutrition calculation failed',
  [ErrorCode.NUTRITION_DATA_INCOMPLETE]: 'Nutrition data is incomplete',

  // Meal Management
  [ErrorCode.MEAL_NOT_FOUND]: 'Meal not found',
  [ErrorCode.MEAL_INVALID_DATE]: 'Invalid meal date',
  [ErrorCode.MEAL_DUPLICATE_ENTRY]: 'Duplicate meal entry',
  [ErrorCode.MEAL_CALCULATION_ERROR]: 'Meal calculation failed',

  // Calendar
  [ErrorCode.CALENDAR_INVALID_DATE_RANGE]: 'Invalid calendar date range',
  [ErrorCode.CALENDAR_DATA_NOT_FOUND]: 'Calendar data not found',

  // Database
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Database connection failed',
  [ErrorCode.DATABASE_QUERY_ERROR]: 'Database query failed',
  [ErrorCode.DATABASE_CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCode.DATABASE_TRANSACTION_ERROR]: 'Database transaction failed',
  [ErrorCode.DATABASE_MIGRATION_ERROR]: 'Database migration failed',

  // External Services
  [ErrorCode.EXTERNAL_API_UNAVAILABLE]: 'External service is unavailable',
  [ErrorCode.EXTERNAL_API_RATE_LIMITED]: 'External API rate limit exceeded',
  [ErrorCode.EXTERNAL_API_INVALID_RESPONSE]: 'Invalid response from external API',
  [ErrorCode.EXTERNAL_API_TIMEOUT]: 'External API request timeout',

  // System
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.CONFIGURATION_ERROR]: 'System configuration error',
  [ErrorCode.FEATURE_NOT_IMPLEMENTED]: 'Feature not yet implemented',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Requested resource not found',
  [ErrorCode.OPERATION_TIMEOUT]: 'Operation timed out',

  // File & Media
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ErrorCode.FILE_INVALID_FORMAT]: 'Invalid file format',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',
};