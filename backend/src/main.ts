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
    .setDescription(
      `API documentation for FoodTracker application
    
## Rate Limiting
This API implements rate limiting to ensure fair usage and protect against abuse.

### Rate Limit Categories:
- **Default**: 60 requests/minute (production) or 120 requests/minute (development)
- **Auth**: 5 requests/minute for login and registration endpoints
- **Mutation**: 30 requests/minute (production) or 60 requests/minute (development) for data modifications
- **Query**: 100 requests/minute (production) or 200 requests/minute (development) for data queries
- **Expensive**: 10 requests/5 minutes for resource-intensive operations

### Rate Limit Headers:
All responses include the following headers:
- \`X-RateLimit-Limit\`: Maximum number of requests allowed in the current window
- \`X-RateLimit-Remaining\`: Number of requests remaining in the current window
- \`X-RateLimit-Reset\`: Time at which the rate limit window resets (ISO 8601)
- \`X-RateLimit-Category\`: The rate limit category applied to the endpoint

### Rate Limit Exceeded:
When rate limit is exceeded, the API returns:
- Status Code: 429 Too Many Requests
- Header: \`Retry-After\` with seconds until rate limit resets
- Body: Error message with retry information
    `,
    )
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management endpoints")
    .addTag("meals", "Meal tracking endpoints")
    .addTag("nutrition", "Nutrition data endpoints")
    .addTag("health", "Health check endpoints")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 FoodTracker Backend running on port ${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
