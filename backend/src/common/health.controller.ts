import { Controller, Get, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../features/auth/decorators/public.decorator";
import { SkipRateLimit } from "./decorators/rate-limit.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor() {}
  @Get()
  @Public() // Route publique, pas d'auth requise
  @SkipRateLimit() // Pas de rate limiting pour les health checks
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "foodtracker-backend",
      environment: process.env.NODE_ENV || "development",
      rateLimitingDisabled: process.env.DISABLE_RATE_LIMITING === "true",
    };
  }

  @Post("reset-rate-limits")
  @Public()
  @SkipRateLimit()
  @ApiOperation({ summary: "Rate limits will naturally expire (development info)" })
  @ApiResponse({ status: 200, description: "Rate limit info provided" })
  @ApiResponse({ status: 403, description: "Not allowed in production" })
  async resetRateLimits() {
    // Only provide info in development
    if (process.env.NODE_ENV === "production") {
      return {
        error: "Rate limit information not available in production",
        status: 403,
      };
    }

    return {
      status: "info",
      message: "Rate limits automatically expire based on TTL configuration",
      ttl: {
        auth: "1 minute",
        query: "1 minute", 
        mutation: "1 minute",
        default: "1 minute",
        expensive: "5 minutes",
        burst: "1 second"
      },
      note: "Wait for the TTL period to pass, or restart the backend service to reset all counters",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      rateLimitingDisabled: process.env.DISABLE_RATE_LIMITING === "true",
    };
  }
}
