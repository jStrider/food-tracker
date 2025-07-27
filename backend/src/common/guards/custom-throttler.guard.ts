import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";
import { RATE_LIMIT_CATEGORIES } from "../../config/rate-limit.config";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Get the throttler name based on the rate limit category
   */
  protected async getThrottlerName(context: ExecutionContext): Promise<string> {
    const category = this.reflector.get<string>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // Return the category if set, otherwise use default
    return category || RATE_LIMIT_CATEGORIES.DEFAULT;
  }

  /**
   * Generate a unique key for rate limiting
   * This can be overridden to implement per-user rate limiting
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip;

    // If user is authenticated, use user ID for rate limiting
    // Otherwise, use IP address
    const identifier = user?.id || ip;

    return `${identifier}:${name}:${suffix}`;
  }

  /**
   * Custom error response for rate limit exceeded
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get the rate limit info from the context
    const category =
      this.reflector.get<string>(RATE_LIMIT_KEY, context.getHandler()) ||
      RATE_LIMIT_CATEGORIES.DEFAULT;

    // Set rate limit headers
    const ttl = this.getTtlFromCategory(category);
    const limit = this.getLimitFromCategory(category);

    response.setHeader("X-RateLimit-Limit", limit);
    response.setHeader("X-RateLimit-Remaining", 0);
    response.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + ttl).toISOString(),
    );
    response.setHeader("Retry-After", Math.ceil(ttl / 1000));

    throw new ThrottlerException("Too many requests. Please try again later.");
  }

  /**
   * Get TTL based on category
   */
  private getTtlFromCategory(category: string): number {
    const ttlMap = {
      [RATE_LIMIT_CATEGORIES.DEFAULT]: 60000,
      [RATE_LIMIT_CATEGORIES.AUTH]: 60000,
      [RATE_LIMIT_CATEGORIES.MUTATION]: 60000,
      [RATE_LIMIT_CATEGORIES.QUERY]: 60000,
      [RATE_LIMIT_CATEGORIES.EXPENSIVE]: 300000,
    };
    return ttlMap[category] || 60000;
  }

  /**
   * Get limit based on category
   */
  private getLimitFromCategory(category: string): number {
    const isProduction = process.env.NODE_ENV === "production";
    const limitMap = {
      [RATE_LIMIT_CATEGORIES.DEFAULT]: isProduction ? 60 : 120,
      [RATE_LIMIT_CATEGORIES.AUTH]: 5,
      [RATE_LIMIT_CATEGORIES.MUTATION]: isProduction ? 30 : 60,
      [RATE_LIMIT_CATEGORIES.QUERY]: isProduction ? 100 : 200,
      [RATE_LIMIT_CATEGORIES.EXPENSIVE]: 10,
    };
    return limitMap[category] || 60;
  }
}
