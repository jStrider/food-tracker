import { Controller, Get, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ThrottlerStorageService } from "@nestjs/throttler";
import { Public } from "../features/auth/decorators/public.decorator";
import { SkipRateLimit } from "./decorators/rate-limit.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly throttlerStorage: ThrottlerStorageService) {}
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
  @ApiOperation({ summary: "Reset all rate limiting counters (development only)" })
  @ApiResponse({ status: 200, description: "Rate limits reset successfully" })
  @ApiResponse({ status: 403, description: "Not allowed in production" })
  async resetRateLimits() {
    // Only allow in development or when explicitly enabled
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_RATE_RESET !== "true") {
      return {
        error: "Rate limit reset not allowed in production",
        status: 403,
      };
    }

    try {
      // Clear the throttler storage (this will reset all rate limit counters)
      // Note: Direct storage access might not be available, this is a best-effort attempt
      if (this.throttlerStorage && typeof this.throttlerStorage.storage === 'object') {
        // Try different methods depending on storage type
        const storage = this.throttlerStorage.storage as any;
        if (typeof storage.clear === 'function') {
          await storage.clear();
        } else if (typeof storage.flushAll === 'function') {
          await storage.flushAll();
        } else if (typeof storage.reset === 'function') {
          await storage.reset();
        }
      }
      
      return {
        status: "ok",
        message: "Rate limiting reset attempted (counters will naturally expire within 1-5 minutes)",
        timestamp: new Date().toISOString(),
        note: "Rate limits reset automatically after their TTL expires",
      };
    } catch (error) {
      return {
        status: "partial",
        message: "Rate limits will naturally expire within 1-5 minutes",
        note: "Direct storage reset failed, but limits auto-expire based on TTL",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
