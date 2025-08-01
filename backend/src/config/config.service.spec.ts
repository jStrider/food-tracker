import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AppConfigService } from "./config.service";

describe("AppConfigService", () => {
  let service: AppConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Setup default valid values for validation
    mockConfigService.get.mockImplementation((key) => {
      const defaults = {
        NODE_ENV: "test",
        PORT: 3001,
        DATABASE_PATH: "data/test.db",
        JWT_SECRET: "test-secret-key-with-32-characters",
        JWT_EXPIRES_IN: "24h",
        OPENFOODFACTS_API_URL: "https://api.test.com",
        THROTTLE_TTL: 60000,
        THROTTLE_LIMIT: 100,
        LOG_LEVEL: "info",
        CORS_ORIGIN: "http://localhost:3000",
        HEALTH_CHECK_ENDPOINT: "/health",
      };
      return defaults[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock logger to prevent console noise during tests
    (service as any).logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNodeEnv", () => {
    it("should return NODE_ENV value", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue("development");

      const result = service.getNodeEnv();

      expect(result).toBe("development");
      expect(mockConfigService.get).toHaveBeenCalledWith("NODE_ENV", {
        infer: true,
      });
    });
  });

  describe("getPort", () => {
    it("should return PORT value", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue(3001);

      const result = service.getPort();

      expect(result).toBe(3001);
      expect(mockConfigService.get).toHaveBeenCalledWith("PORT", {
        infer: true,
      });
    });
  });

  describe("getJwtSecret", () => {
    it("should return JWT_SECRET value", () => {
      const secret = "test-secret-key-32-characters-long";
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue(secret);

      const result = service.getJwtSecret();

      expect(result).toBe(secret);
      expect(mockConfigService.get).toHaveBeenCalledWith("JWT_SECRET", {
        infer: true,
      });
    });
  });

  describe("isDevelopment", () => {
    it("should return true when NODE_ENV is development", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue("development");

      const result = service.isDevelopment();

      expect(result).toBe(true);
    });

    it("should return false when NODE_ENV is not development", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue("production");

      const result = service.isDevelopment();

      expect(result).toBe(false);
    });
  });

  describe("isProduction", () => {
    it("should return true when NODE_ENV is production", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue("production");

      const result = service.isProduction();

      expect(result).toBe(true);
    });

    it("should return false when NODE_ENV is not production", () => {
      mockConfigService.get.mockReset();
      mockConfigService.get.mockReturnValue("development");

      const result = service.isProduction();

      expect(result).toBe(false);
    });
  });

  describe("getAllConfig", () => {
    it("should return complete configuration without exposing JWT secret", () => {
      mockConfigService.get.mockReset();
      // Setup mock implementation with specific return values
      mockConfigService.get.mockImplementation((key) => {
        const testValues = {
          NODE_ENV: "development",
          PORT: 3001,
          CORS_ORIGIN: "http://localhost:3000",
          DATABASE_PATH: "data/test.db",
          JWT_EXPIRES_IN: "24h",
          JWT_SECRET: "test-secret-32-chars-long",
          OPENFOODFACTS_API_URL: "https://api.example.com",
          THROTTLE_TTL: 60000,
          THROTTLE_LIMIT: 100,
          LOG_LEVEL: "info",
          HEALTH_CHECK_ENDPOINT: "/health",
        };
        return testValues[key];
      });

      const result = service.getAllConfig();

      expect(result).toEqual({
        app: {
          nodeEnv: "development",
          port: 3001,
          corsOrigin: "http://localhost:3000",
        },
        database: {
          path: "data/test.db",
        },
        jwt: {
          expiresIn: "24h",
          hasSecret: true,
          secretLength: 25,
        },
        externalApis: {
          openFoodFacts: "https://api.example.com",
        },
        throttle: {
          ttl: 60000,
          limit: 100,
        },
        logging: {
          level: "info",
        },
        health: {
          endpoint: "/health",
        },
      });

      // Verify that the actual secret is not exposed
      expect(result.jwt).not.toHaveProperty("secret");
    });
  });
});
