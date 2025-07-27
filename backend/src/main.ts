import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { getCorsConfig } from "./config/cors.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with environment-specific configuration
  app.enableCors(getCorsConfig());

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("FoodTracker API")
    .setDescription("API documentation for FoodTracker application")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management endpoints")
    .addTag("meals", "Meal tracking endpoints")
    .addTag("nutrition", "Nutrition data endpoints")
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 FoodTracker Backend running on port ${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
