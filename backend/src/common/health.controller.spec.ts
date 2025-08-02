import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("check", () => {
    it("should return health status", () => {
      const result = controller.check();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        service: "foodtracker-backend",
        environment: expect.any(String),
        rateLimitingDisabled: expect.any(Boolean),
      });
    });

    it("should return current timestamp", () => {
      const result = controller.check();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it("should return environment", () => {
      const result = controller.check();

      expect(result.environment).toBeDefined();
      expect(typeof result.environment).toBe("string");
    });

    it("should return consistent structure", () => {
      const result = controller.check();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("service");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("environment");
      expect(result).toHaveProperty("rateLimitingDisabled");
      expect(Object.keys(result)).toHaveLength(5);
    });
  });
});