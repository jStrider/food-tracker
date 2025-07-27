import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

// Configuration
import { AppConfigModule } from "./config/config.module";

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
import { JwtAuthGuard } from "./features/auth/guards/jwt-auth.guard";

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 seconde
        limit: 3, // 3 requêtes par seconde
      },
      {
        name: "medium",
        ttl: 10000, // 10 secondes
        limit: 20, // 20 requêtes par 10 secondes
      },
      {
        name: "long",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requêtes par minute
      },
    ]),
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
      useClass: ThrottlerGuard, // Rate limiting global
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Auth global (sauf routes @Public)
    },
  ],
})
export class AppModule {}
