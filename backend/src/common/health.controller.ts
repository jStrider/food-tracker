import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../features/auth/decorators/public.decorator";
import { SkipRateLimit } from "./decorators/rate-limit.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
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
    };
  }
}
