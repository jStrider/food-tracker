import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";
import { RATE_LIMIT_CATEGORIES } from "../../config/rate-limit.config";

@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get the rate limit category for this endpoint
    const category =
      this.reflector.get<string>(RATE_LIMIT_KEY, context.getHandler()) ||
      RATE_LIMIT_CATEGORIES.DEFAULT;

    // Get rate limit configuration based on category
    const limit = this.getLimitFromCategory(category);
    const ttl = this.getTtlFromCategory(category);

    // Calculate rate limit headers
    // Note: In a real implementation, you would track actual usage
    // This is a simplified version for demonstration
    const remaining = limit - 1; // Simplified - in reality, track actual usage
    const resetTime = new Date(Date.now() + ttl).toISOString();

    return next.handle().pipe(
      tap(() => {
        // Add rate limit headers to successful responses
        response.setHeader("X-RateLimit-Limit", limit);
        response.setHeader("X-RateLimit-Remaining", remaining);
        response.setHeader("X-RateLimit-Reset", resetTime);
        response.setHeader("X-RateLimit-Category", category);
      }),
    );
  }

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
