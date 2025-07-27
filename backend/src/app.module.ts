import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

// Configuration
import { AppConfigModule } from "./config/config.module";
import { getRateLimitConfig } from "./config/rate-limit.config";

// Feature modules
import { UsersModule } from "./features/users/users.module";
import { MealsModule } from "./features/meals/meals.module";
import { FoodsModule } from "./features/foods/foods.module";
import { NutritionModule } from "./features/nutrition/nutrition.module";
import { CalendarModule } from "./features/calendar/calendar.module";
import { AuthModule } from "./features/auth/auth.module";

// Common modules
import { DatabaseModule } from "./database/database.module";
import { McpModule } from "./mcp/mcp.module";
import { HealthController } from "./common/health.controller";
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard';
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { RateLimitHeadersInterceptor } from "./common/interceptors/rate-limit-headers.interceptor";

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot(getRateLimitConfig()),
    DatabaseModule,
    McpModule,
    AuthModule,
    UsersModule,
    MealsModule,
    FoodsModule,
    NutritionModule,
    CalendarModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Custom rate limiting guard
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Global authentication
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitHeadersInterceptor, // Add rate limit headers to responses
    },
  ],
})
export class AppModule {}
