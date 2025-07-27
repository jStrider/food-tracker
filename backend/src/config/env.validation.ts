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
    .description("Secret key for JWT token signing (minimum 32 characters)"),

  JWT_EXPIRES_IN: Joi.string()
    .default("24h")
    .pattern(/^\d+[smhd]$/)
    .description("JWT token expiration time (e.g., 24h, 7d)"),

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
