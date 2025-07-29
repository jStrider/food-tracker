import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const getRateLimitConfig = (): ThrottlerModuleOptions => {
  const isProduction = process.env.NODE_ENV === "production";
  const isRateLimitingDisabled = process.env.DISABLE_RATE_LIMITING === "true";

  // Emergency disable option
  if (isRateLimitingDisabled) {
    return [
      {
        name: "disabled",
        ttl: 1000,
        limit: 99999,
      },
    ];
  }

  return [
    {
      // Default global rate limit - increased for normal app usage
      name: "default",
      ttl: 60000, // 1 minute
      limit: isProduction ? 200 : 400, // 200 requests per minute in production, 400 in dev
    },
    {
      // Reasonable rate limit for authentication endpoints
      name: "auth",
      ttl: 60000, // 1 minute
      limit: isProduction ? 10 : 20, // 10 attempts per minute in production, 20 in dev
    },
    {
      // Moderate rate limit for data mutations
      name: "mutation",
      ttl: 60000, // 1 minute
      limit: isProduction ? 100 : 200, // 100 mutations per minute in production
    },
    {
      // Relaxed rate limit for read operations (calendar, nutrition data)
      name: "query",
      ttl: 60000, // 1 minute
      limit: isProduction ? 300 : 600, // 300 queries per minute in production
    },
    {
      // Very strict rate limit for expensive operations
      name: "expensive",
      ttl: 300000, // 5 minutes
      limit: 10, // 10 requests per 5 minutes
    },
    {
      // Burst protection - short window
      name: "burst",
      ttl: 1000, // 1 second
      limit: 10, // 10 requests per second max
    },
  ];
};

// Rate limit categories for different endpoint types
export const RATE_LIMIT_CATEGORIES = {
  AUTH: "auth",
  MUTATION: "mutation",
  QUERY: "query",
  EXPENSIVE: "expensive",
  DEFAULT: "default",
} as const;

export type RateLimitCategory =
  (typeof RATE_LIMIT_CATEGORIES)[keyof typeof RATE_LIMIT_CATEGORIES];
