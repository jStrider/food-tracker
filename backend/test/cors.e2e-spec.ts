import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getCorsConfig } from "../src/config/cors.config";

describe("CORS Configuration (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(getCorsConfig());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Preflight requests", () => {
    it("should handle OPTIONS requests", () => {
      return request(app.getHttpServer()).options("/api/health").expect(204);
    });

    it("should include proper CORS headers for allowed origins", () => {
      const allowedOrigin = "http://localhost:3000";

      return request(app.getHttpServer())
        .options("/api/health")
        .set("Origin", allowedOrigin)
        .expect(204)
        .expect("Access-Control-Allow-Origin", allowedOrigin)
        .expect("Access-Control-Allow-Credentials", "true")
        .expect((res) => {
          expect(res.headers["access-control-allow-methods"]).toBeDefined();
          expect(res.headers["access-control-allow-headers"]).toBeDefined();
        });
    });

    it("should reject requests from unauthorized origins in production", async () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://app.foodtracker.com";

      // Recreate app with production settings
      const prodApp = await createProductionApp();

      try {
        await request(prodApp.getHttpServer())
          .get("/api/health")
          .set("Origin", "https://malicious-site.com")
          .expect((res) => {
            // In production, unauthorized origins should be blocked
            expect(res.headers["access-control-allow-origin"]).toBeUndefined();
          });
      } finally {
        await prodApp.close();
        process.env.NODE_ENV = originalEnv;
        delete process.env.ALLOWED_ORIGINS;
      }
    });
  });

  describe("Regular requests", () => {
    it("should include CORS headers for allowed origins", () => {
      const allowedOrigin = "http://localhost:3000";

      return request(app.getHttpServer())
        .get("/api/health")
        .set("Origin", allowedOrigin)
        .expect(200)
        .expect("Access-Control-Allow-Origin", allowedOrigin)
        .expect("Access-Control-Allow-Credentials", "true");
    });

    it("should expose custom headers", () => {
      return request(app.getHttpServer())
        .get("/api/health")
        .set("Origin", "http://localhost:3000")
        .expect(200)
        .expect((res) => {
          const exposedHeaders = res.headers["access-control-expose-headers"];
          expect(exposedHeaders).toContain("X-Total-Count");
          expect(exposedHeaders).toContain("X-Page-Count");
        });
    });
  });

  describe("Development vs Production", () => {
    it("should allow requests without origin in development", () => {
      process.env.NODE_ENV = "development";

      return (
        request(app.getHttpServer())
          .get("/api/health")
          // No Origin header
          .expect(200)
      );
    });

    it("should use longer max-age in production", async () => {
      const originalEnv = process.env.NODE_ENV;

      // Test development
      process.env.NODE_ENV = "development";
      const devApp = await createApp();

      await request(devApp.getHttpServer())
        .options("/api/health")
        .set("Origin", "http://localhost:3000")
        .expect(204)
        .expect("Access-Control-Max-Age", "3600");

      await devApp.close();

      // Test production
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://app.foodtracker.com";
      const prodApp = await createProductionApp();

      await request(prodApp.getHttpServer())
        .options("/api/health")
        .set("Origin", "https://app.foodtracker.com")
        .expect(204)
        .expect("Access-Control-Max-Age", "86400");

      await prodApp.close();
      process.env.NODE_ENV = originalEnv;
      delete process.env.ALLOWED_ORIGINS;
    });
  });
});

async function createApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.enableCors(getCorsConfig());
  await app.init();
  return app;
}

async function createProductionApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.enableCors(getCorsConfig());
  await app.init();
  return app;
}
