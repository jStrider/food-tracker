import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "./env.validation";

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
  ) {
    this.validateCriticalConfiguration();
  }

  private validateCriticalConfiguration(): void {
    const criticalChecks = [
      {
        key: "JWT_SECRET",
        message:
          "JWT_SECRET is missing or too short. Generate one with: openssl rand -base64 32",
        validation: () => {
          const secret = this.getJwtSecret();
          return secret && secret.length >= 32;
        },
      },
      {
        key: "NODE_ENV",
        message: "NODE_ENV should be set to development, production, or test",
        validation: () => {
          const env = this.getNodeEnv();
          return ["development", "production", "test"].includes(env);
        },
      },
      {
        key: "DATABASE_PATH",
        message: "DATABASE_PATH must be specified",
        validation: () => {
          const path = this.getDatabasePath();
          return !!path;
        },
      },
    ];

    const failures: string[] = [];

    for (const check of criticalChecks) {
      if (!check.validation()) {
        failures.push(`❌ ${check.key}: ${check.message}`);
      } else {
        this.logger.log(`✅ ${check.key}: Configured correctly`);
      }
    }

    if (failures.length > 0) {
      this.logger.error("🚨 CRITICAL CONFIGURATION ERRORS:");
      failures.forEach((failure) => this.logger.error(failure));
      this.logger.error(
        "Please check your .env file and ensure all required variables are set.",
      );

      if (this.isProduction()) {
        throw new Error(
          "Critical configuration errors in production environment",
        );
      } else {
        this.logger.warn(
          "⚠️  Continuing in development mode with configuration errors",
        );
      }
    }

    this.logSecurityWarnings();
  }

  private logSecurityWarnings(): void {
    if (this.isProduction()) {
      // Production security checks
      if (
        this.getJwtSecret() ===
        "your-super-secure-jwt-secret-key-here-minimum-32-characters"
      ) {
        this.logger.error(
          "🚨 SECURITY RISK: Using default JWT_SECRET in production!",
        );
      }

      if (this.getDatabasePath().includes("data/")) {
        this.logger.warn(
          "⚠️  Using local database path in production. Consider external database.",
        );
      }
    } else {
      // Development warnings
      if (!this.getJwtSecret()) {
        this.logger.warn(
          "⚠️  JWT_SECRET not set. Authentication will not work.",
        );
      }
    }
  }

  // Application Configuration
  getNodeEnv(): string {
    return this.configService.get("NODE_ENV", { infer: true });
  }

  getPort(): number {
    return this.configService.get("PORT", { infer: true });
  }

  getCorsOrigin(): string {
    return this.configService.get("CORS_ORIGIN", { infer: true });
  }

  isProduction(): boolean {
    return this.getNodeEnv() === "production";
  }

  isDevelopment(): boolean {
    return this.getNodeEnv() === "development";
  }

  isTest(): boolean {
    return this.getNodeEnv() === "test";
  }

  // Database Configuration
  getDatabasePath(): string {
    return this.configService.get("DATABASE_PATH", { infer: true });
  }

  // Authentication Configuration
  getJwtSecret(): string {
    return this.configService.get("JWT_SECRET", { infer: true });
  }

  getJwtExpiresIn(): string {
    return this.configService.get("JWT_EXPIRES_IN", { infer: true });
  }

  // External APIs
  getOpenFoodFactsApiUrl(): string {
    return this.configService.get("OPENFOODFACTS_API_URL", { infer: true });
  }

  // Rate Limiting
  getThrottleTtl(): number {
    return this.configService.get("THROTTLE_TTL", { infer: true });
  }

  getThrottleLimit(): number {
    return this.configService.get("THROTTLE_LIMIT", { infer: true });
  }

  // Logging
  getLogLevel(): string {
    return this.configService.get("LOG_LEVEL", { infer: true });
  }

  // Health Check
  getHealthCheckEndpoint(): string {
    return this.configService.get("HEALTH_CHECK_ENDPOINT", { infer: true });
  }

  // Utility methods
  getAllConfig(): Record<string, any> {
    return {
      app: {
        nodeEnv: this.getNodeEnv(),
        port: this.getPort(),
        corsOrigin: this.getCorsOrigin(),
      },
      database: {
        path: this.getDatabasePath(),
      },
      jwt: {
        expiresIn: this.getJwtExpiresIn(),
        // Never expose the actual secret
        hasSecret: !!this.getJwtSecret(),
        secretLength: this.getJwtSecret()?.length || 0,
      },
      externalApis: {
        openFoodFacts: this.getOpenFoodFactsApiUrl(),
      },
      throttle: {
        ttl: this.getThrottleTtl(),
        limit: this.getThrottleLimit(),
      },
      logging: {
        level: this.getLogLevel(),
      },
      health: {
        endpoint: this.getHealthCheckEndpoint(),
      },
    };
  }
}
