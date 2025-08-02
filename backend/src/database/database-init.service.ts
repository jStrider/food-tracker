import { Injectable, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";
import { seedTempUser } from "./seed-temp-user";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Only seed in development environment
    const environment = this.configService.get<string>("NODE_ENV", "development");
    
    if (environment === "development") {
      try {
        console.log("🌱 Initializing database...");
        await this.seedDatabase();
        console.log("✅ Database initialization complete");
      } catch (error) {
        console.error("❌ Database initialization failed:", error);
        // Don't throw - allow app to start even if seeding fails
      }
    }
  }

  private async seedDatabase(): Promise<void> {
    // Wait a bit for database to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run seed scripts
    await seedTempUser(this.dataSource);
    
    // Add more seed scripts here as needed
    // await seedOtherData(this.dataSource);
  }
}