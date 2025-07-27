import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getCorsConfig } from "./config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with environment-specific configuration
  app.enableCors(getCorsConfig());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 FoodTracker Backend running on port ${port}`);
}

bootstrap();
