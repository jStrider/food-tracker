import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const getRateLimitConfig = (): ThrottlerModuleOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    {
      // Default global rate limit
      name: "default",
      ttl: 60000, // 1 minute
      limit: isProduction ? 60 : 120, // 60 requests per minute in production, 120 in dev
    },
    {
      // Strict rate limit for authentication endpoints
      name: "auth",
      ttl: 60000, // 1 minute
      limit: 5, // 5 attempts per minute
    },
    {
      // Moderate rate limit for data mutations
      name: "mutation",
      ttl: 60000, // 1 minute
      limit: isProduction ? 30 : 60, // 30 mutations per minute in production
    },
    {
      // Relaxed rate limit for read operations
      name: "query",
      ttl: 60000, // 1 minute
      limit: isProduction ? 100 : 200, // 100 queries per minute in production
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
