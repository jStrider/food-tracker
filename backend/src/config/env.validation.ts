import * as Joi from "joi";

export interface EnvironmentVariables {
  // Application
  NODE_ENV: "development" | "production" | "test";
  PORT: number;

  // Database
  DATABASE_PATH: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;

  // External APIs
  OPENFOODFACTS_API_URL: string;

  // Rate Limiting
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;

  // Logging
  LOG_LEVEL: "error" | "warn" | "info" | "debug";

  // CORS
  CORS_ORIGIN: string;

  // Health Check
  HEALTH_CHECK_ENDPOINT: string;
}

export const validationSchema = Joi.object<EnvironmentVariables>({
  // Application
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development")
    .description("The application environment"),

  PORT: Joi.number()
    .port()
    .default(3001)
    .description("The port on which the application runs"),

  // Database
  DATABASE_PATH: Joi.string()
    .default("data/foodtracker.db")
    .description("Path to the SQLite database file"),

  // Authentication - CRITICAL SECURITY
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .custom((value, helpers) => {
      // Additional validation for JWT secret strength
      if (value.length < 64 && process.env.NODE_ENV === 'production') {
        return helpers.error('any.custom', {
          message: 'JWT_SECRET should be at least 64 characters in production for enhanced security'
        });
      }
      // Check for common weak patterns
      if (/^[a-zA-Z]+$/.test(value) || /^[0-9]+$/.test(value)) {
        return helpers.error('any.custom', {
          message: 'JWT_SECRET must contain a mix of characters, not just letters or numbers'
        });
      }
      return value;
    })
    .description("Secret key for JWT token signing (minimum 32 characters, 64+ recommended for production)"),

  JWT_EXPIRES_IN: Joi.string()
    .default("24h")
    .pattern(/^\d+[smhd]$/)
    .description("JWT token expiration time (e.g., 24h, 7d)"),

  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(20)
    .default(12)
    .description("Number of bcrypt rounds for password hashing (10-20, higher = more secure but slower)"),

  // External APIs
  OPENFOODFACTS_API_URL: Joi.string()
    .uri()
    .default("https://world.openfoodfacts.org/api/v0")
    .description("OpenFoodFacts API base URL"),

  // Rate Limiting
  THROTTLE_TTL: Joi.number()
    .positive()
    .default(60000)
    .description("Rate limiting time window in milliseconds"),

  THROTTLE_LIMIT: Joi.number()
    .positive()
    .default(100)
    .description("Maximum requests per time window"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info")
    .description("Application log level"),

  // CORS
  CORS_ORIGIN: Joi.string()
    .default("http://localhost:3000")
    .description("Allowed CORS origins (comma-separated for multiple)"),

  // Health Check
  HEALTH_CHECK_ENDPOINT: Joi.string()
    .default("/health")
    .description("Health check endpoint path"),
});

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const { error, value } = validationSchema.validate(config, {
    allowUnknown: true, // Allow other env vars to exist
    abortEarly: false, // Show all validation errors
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join(", ");
    throw new Error(`Environment validation failed: ${errors}`);
  }

  return value;
}
