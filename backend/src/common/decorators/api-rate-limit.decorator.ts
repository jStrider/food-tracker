import { applyDecorators } from "@nestjs/common";
import { ApiHeader, ApiResponse } from "@nestjs/swagger";
import {
  RateLimitCategory,
  RATE_LIMIT_CATEGORIES,
} from "../../config/rate-limit.config";

/**
 * Swagger decorator to document rate limit headers
 */
export const ApiRateLimit = (
  category: RateLimitCategory = RATE_LIMIT_CATEGORIES.DEFAULT,
) => {
  const limits = getRateLimitsByCategory(category);

  return applyDecorators(
    ApiHeader({
      name: "X-RateLimit-Limit",
      description: `Maximum number of requests allowed per ${limits.window}`,
      example: limits.limit,
    }),
    ApiHeader({
      name: "X-RateLimit-Remaining",
      description:
        "Number of requests remaining in the current rate limit window",
      example: limits.limit - 1,
    }),
    ApiHeader({
      name: "X-RateLimit-Reset",
      description: "Time at which the rate limit window resets (ISO 8601)",
      example: new Date(Date.now() + limits.ttl).toISOString(),
    }),
    ApiHeader({
      name: "X-RateLimit-Category",
      description: "Rate limit category applied to this endpoint",
      example: category,
    }),
    ApiResponse({
      status: 429,
      description: `Rate limit exceeded. Maximum ${limits.limit} requests per ${limits.window}`,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "Too many requests. Please try again later.",
              },
              error: {
                type: "string",
                example: "Rate Limit Exceeded",
              },
              statusCode: {
                type: "number",
                example: 429,
              },
              retryAfter: {
                type: "number",
                example: Math.ceil(limits.ttl / 1000),
                description: "Seconds until rate limit resets",
              },
              category: {
                type: "string",
                example: category,
              },
            },
          },
        },
      },
      headers: {
        "Retry-After": {
          description: "Seconds until rate limit resets",
          schema: { type: "number" },
        },
      },
    }),
  );
};

/**
 * Pre-configured Swagger decorators for common rate limit categories
 */
export const ApiAuthRateLimit = () => ApiRateLimit(RATE_LIMIT_CATEGORIES.AUTH);
export const ApiMutationRateLimit = () =>
  ApiRateLimit(RATE_LIMIT_CATEGORIES.MUTATION);
export const ApiQueryRateLimit = () =>
  ApiRateLimit(RATE_LIMIT_CATEGORIES.QUERY);
export const ApiExpensiveRateLimit = () =>
  ApiRateLimit(RATE_LIMIT_CATEGORIES.EXPENSIVE);

/**
 * Get rate limit configuration by category
 */
function getRateLimitsByCategory(category: RateLimitCategory) {
  const isProduction = process.env.NODE_ENV === "production";

  const configs = {
    [RATE_LIMIT_CATEGORIES.DEFAULT]: {
      limit: isProduction ? 60 : 120,
      ttl: 60000,
      window: "minute",
    },
    [RATE_LIMIT_CATEGORIES.AUTH]: {
      limit: 5,
      ttl: 60000,
      window: "minute",
    },
    [RATE_LIMIT_CATEGORIES.MUTATION]: {
      limit: isProduction ? 30 : 60,
      ttl: 60000,
      window: "minute",
    },
    [RATE_LIMIT_CATEGORIES.QUERY]: {
      limit: isProduction ? 100 : 200,
      ttl: 60000,
      window: "minute",
    },
    [RATE_LIMIT_CATEGORIES.EXPENSIVE]: {
      limit: 10,
      ttl: 300000,
      window: "5 minutes",
    },
  };

  return configs[category] || configs[RATE_LIMIT_CATEGORIES.DEFAULT];
}
