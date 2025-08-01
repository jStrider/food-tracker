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

  describe("health", () => {
    it("should return health status", () => {
      const result = controller.health();

      expect(result).toEqual({
        status: "ok",
        message: "FoodTracker backend is running",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it("should return current timestamp", () => {
      const result = controller.health();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it("should return positive uptime", () => {
      const result = controller.health();

      expect(result.uptime).toBeGreaterThan(0);
      expect(typeof result.uptime).toBe("number");
    });

    it("should return consistent structure", () => {
      const result = controller.health();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("uptime");
      expect(Object.keys(result)).toHaveLength(4);
    });
  });
});