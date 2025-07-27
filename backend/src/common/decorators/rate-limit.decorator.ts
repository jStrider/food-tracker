import { SetMetadata } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  RATE_LIMIT_CATEGORIES,
  RateLimitCategory,
} from "../../config/rate-limit.config";

export const RATE_LIMIT_KEY = "rate-limit-category";

/**
 * Decorator to apply specific rate limit category to an endpoint
 * @param category - The rate limit category to apply
 */
export const RateLimit = (category: RateLimitCategory) => {
  return SetMetadata(RATE_LIMIT_KEY, category);
};

/**
 * Pre-configured rate limit decorators for common use cases
 */
export const AuthRateLimit = () => RateLimit(RATE_LIMIT_CATEGORIES.AUTH);
export const MutationRateLimit = () =>
  RateLimit(RATE_LIMIT_CATEGORIES.MUTATION);
export const QueryRateLimit = () => RateLimit(RATE_LIMIT_CATEGORIES.QUERY);
export const ExpensiveRateLimit = () =>
  RateLimit(RATE_LIMIT_CATEGORIES.EXPENSIVE);

/**
 * Skip rate limiting for specific endpoints (e.g., health checks)
 */
export const SkipRateLimit = () => Throttle({ default: { limit: 0, ttl: 0 } });
