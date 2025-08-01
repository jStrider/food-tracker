import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from "@nestjs/core";
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

// Enhanced logging and error handling
import { LoggerModule } from "./common/logger/logger.module";
import { HealthModule } from "./common/health/health.module";
import { EnhancedExceptionFilter } from "./common/filters/enhanced-exception.filter";
import { EnhancedLoggingInterceptor } from "./common/interceptors/enhanced-logging.interceptor";
import { ErrorHandlerMiddleware } from "./common/middleware/error-handler.middleware";

// Legacy and security components
import { HealthController } from "./common/health.controller";
import { JwtAuthGuard } from "./features/auth/guards/jwt-auth.guard";
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { InputSanitizationGuard } from "./common/guards/input-sanitization.guard";
import { RateLimitHeadersInterceptor } from "./common/interceptors/rate-limit-headers.interceptor";
import { InputValidationMiddleware } from "./common/middleware/input-validation.middleware";
import { EnhancedValidationPipe } from "./common/pipes/enhanced-validation.pipe";

@Module({
  imports: [
    // Core configuration
    AppConfigModule,
    ThrottlerModule.forRoot(getRateLimitConfig()),
    
    // Enhanced logging and error handling
    LoggerModule,
    HealthModule,
    
    // Database and external services
    DatabaseModule,
    McpModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    MealsModule,
    FoodsModule,
    NutritionModule,
    CalendarModule,
  ],
  controllers: [
    HealthController, // Legacy health controller (keeping for compatibility)
  ],
  providers: [
    // Exception handling (highest priority)
    {
      provide: APP_FILTER,
      useClass: EnhancedExceptionFilter, // Enhanced error handling with structured logging
    },
    
    // Input validation pipe with enhanced security
    {
      provide: APP_PIPE,
      useClass: EnhancedValidationPipe,
    },
    
    // Request/Response interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: EnhancedLoggingInterceptor, // Enhanced request/response logging
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitHeadersInterceptor, // Add rate limit headers to responses
    },
    
    // Guards (in execution order)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Rate limiting guard
    },
    {
      provide: APP_GUARD,
      useClass: InputSanitizationGuard, // Input sanitization guard (runs before authentication)
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Authentication guard (runs after input sanitization)
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply error handling middleware first (for request enrichment)
    consumer
      .apply(ErrorHandlerMiddleware)
      .forRoutes('*');
      
    // Apply input validation middleware to all routes
    consumer
      .apply(InputValidationMiddleware)
      .forRoutes('*');
  }
}
