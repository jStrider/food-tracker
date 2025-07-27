import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  // Server
  PORT: Joi.number().default(3001),

  // Database
  DATABASE_PATH: Joi.string().required(),

  // Auth & Security
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),

  // External APIs
  OPENFOODFACTS_API_URL: Joi.string().uri().required(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // CORS
  FRONTEND_URL: Joi.string().uri().required(),

  // Optional OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
});
