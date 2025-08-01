import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerStorage } from "@nestjs/throttler";
import { CustomThrottlerGuard } from "./custom-throttler.guard";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";
import { RATE_LIMIT_CATEGORIES } from "../../config/rate-limit.config";

describe("CustomThrottlerGuard", () => {
  let guard: CustomThrottlerGuard;
  let reflector: Reflector;
  let storage: ThrottlerStorage;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        ip: "127.0.0.1",
        user: { id: "test-user-id" },
      }),
      getResponse: () => ({
        setHeader: jest.fn(),
      }),
    }),
    getHandler: () => jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomThrottlerGuard,
        {
          provide: 'THROTTLER:MODULE_OPTIONS',
          useValue: {
            ttl: 60,
            limit: 10,
            ignoreUserAgents: [],
            skipIf: () => false,
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ThrottlerStorage,
          useValue: {
            increment: jest.fn().mockResolvedValue({ totalHits: 1, timeToExpire: 60000 }),
          },
        },
      ],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);
    reflector = module.get<Reflector>(Reflector);
    storage = module.get<ThrottlerStorage>(ThrottlerStorage);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("getThrottlerName", () => {
    it("should return the rate limit category from metadata", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(RATE_LIMIT_CATEGORIES.AUTH);

      const result = await guard["getThrottlerName"](mockExecutionContext);

      expect(reflector.get).toHaveBeenCalledWith(
        RATE_LIMIT_KEY,
        mockExecutionContext.getHandler(),
      );
      expect(result).toBe(RATE_LIMIT_CATEGORIES.AUTH);
    });

    it("should return default category when no metadata is set", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(undefined);

      const result = await guard["getThrottlerName"](mockExecutionContext);

      expect(result).toBe(RATE_LIMIT_CATEGORIES.DEFAULT);
    });
  });

  describe("generateKey", () => {
    it("should use user ID for authenticated users", () => {
      const result = guard["generateKey"](
        mockExecutionContext,
        "test-suffix",
        "test-name",
      );

      expect(result).toBe("test-user-id:test-name:test-suffix");
    });

    it("should use IP address for anonymous users", () => {
      const anonymousContext = {
        ...mockExecutionContext,
        switchToHttp: () => ({
          getRequest: () => ({
            ip: "192.168.1.1",
            user: undefined,
          }),
          getResponse: () => ({
            setHeader: jest.fn(),
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard["generateKey"](
        anonymousContext,
        "test-suffix",
        "test-name",
      );

      expect(result).toBe("192.168.1.1:test-name:test-suffix");
    });
  });

  describe("throwThrottlingException", () => {
    it("should set rate limit headers and throw exception", async () => {
      const response = {
        setHeader: jest.fn(),
      };
      const context = {
        ...mockExecutionContext,
        switchToHttp: () => ({
          getRequest: () => mockExecutionContext.switchToHttp().getRequest(),
          getResponse: () => response,
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue(RATE_LIMIT_CATEGORIES.AUTH);

      await expect(
        guard["throwThrottlingException"](context, {}),
      ).rejects.toThrow();

      expect(response.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 5);
      expect(response.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Remaining",
        0,
      );
      expect(response.setHeader).toHaveBeenCalledWith("Retry-After", 60);
      expect(response.setHeader).toHaveBeenCalledTimes(4);
    });
  });
});
