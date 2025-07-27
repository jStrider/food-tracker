import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { ThrottlerStorage } from "@nestjs/throttler";

describe("Rate Limiting (e2e)", () => {
  let app: INestApplication;
  let storage: ThrottlerStorage;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    storage = app.get<ThrottlerStorage>(ThrottlerStorage);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear rate limit storage before each test
    if (storage && typeof storage.storage?.clear === "function") {
      storage.storage.clear();
    }
  });

  describe("Auth endpoints", () => {
    it("should allow 5 login attempts within rate limit", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Make 5 requests (the limit for auth endpoints)
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post("/auth/login")
          .send(loginData);

        expect(response.status).not.toBe(429);
        expect(response.headers["x-ratelimit-limit"]).toBe("5");
        expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
      }
    });

    it("should block 6th login attempt with 429", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Make 5 requests to reach the limit
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post("/auth/login").send(loginData);
      }

      // 6th request should be blocked
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginData);

      expect(response.status).toBe(429);
      expect(response.body.error).toBe("Rate Limit Exceeded");
      expect(response.headers["retry-after"]).toBeDefined();
    });
  });

  describe("Health endpoint", () => {
    it("should not apply rate limiting to health checks", async () => {
      // Make many requests to health endpoint
      for (let i = 0; i < 20; i++) {
        const response = await request(app.getHttpServer()).get("/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      }
    });
  });

  describe("Rate limit headers", () => {
    it("should include rate limit headers in responses", async () => {
      const response = await request(app.getHttpServer())
        .get("/meals")
        .set("Authorization", "Bearer fake-token"); // Will fail auth, but we're testing headers

      expect(response.headers["x-ratelimit-limit"]).toBeDefined();
      expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
      expect(response.headers["x-ratelimit-reset"]).toBeDefined();
      expect(response.headers["x-ratelimit-category"]).toBeDefined();
    });
  });

  describe("Different rate limit categories", () => {
    it("should apply different limits for different endpoint types", async () => {
      // Auth endpoint (limit: 5)
      const authResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "test@example.com", password: "password" });

      expect(authResponse.headers["x-ratelimit-limit"]).toBe("5");
      expect(authResponse.headers["x-ratelimit-category"]).toBe("auth");

      // Query endpoint (limit: 120 in dev, 100 in production)
      const queryResponse = await request(app.getHttpServer())
        .get("/meals")
        .set("Authorization", "Bearer fake-token");

      expect(
        parseInt(queryResponse.headers["x-ratelimit-limit"]),
      ).toBeGreaterThan(5);
      expect(queryResponse.headers["x-ratelimit-category"]).toBe("query");
    });
  });
});
