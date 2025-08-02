import { Test, TestingModule } from "@nestjs/testing";
import { ConfigController } from "./config.controller";
import { AppConfigService } from "./config.service";

describe("ConfigController", () => {
  let controller: ConfigController;
  let configService: AppConfigService;

  const mockConfigService = {
    getAllConfig: jest.fn(),
    getJwtSecret: jest.fn(),
    getDatabasePath: jest.fn(),
    isDevelopment: jest.fn(),
    isProduction: jest.fn(),
    getNodeEnv: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getConfiguration", () => {
    it("should return public configuration", () => {
      const mockPublicConfig = {
        database: {
          type: "sqlite",
          logging: false,
        },
        cors: {
          origin: true,
          credentials: true,
        },
        rateLimit: {
          windowMs: 900000,
          max: 100,
        },
        features: {
          openFoodFacts: true,
          caching: true,
        },
      };

      mockConfigService.getAllConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfiguration();

      expect(configService.getAllConfig).toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Configuration retrieved successfully');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result.data).toEqual(mockPublicConfig);
    });

    it("should not expose sensitive configuration", () => {
      const mockPublicConfig = {
        database: {
          type: "sqlite",
          logging: false,
          // Note: password, username, etc. should not be included
        },
        cors: {
          origin: true,
          credentials: true,
        },
      };

      mockConfigService.getAllConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfiguration();

      expect(result).toHaveProperty('data');
      expect(result.data).not.toHaveProperty("jwt");
      expect(result.data).not.toHaveProperty("secrets");
      expect(result.data.database).not.toHaveProperty("password");
      expect(result.data.database).not.toHaveProperty("username");
    });

    it("should handle empty configuration", () => {
      mockConfigService.getAllConfig.mockReturnValue({});

      const result = controller.getConfiguration();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual({});
    });

    it("should maintain configuration structure", () => {
      const mockPublicConfig = {
        database: {
          type: "sqlite",
          logging: false,
        },
        cors: {
          origin: true,
          credentials: true,
        },
        rateLimit: {
          windowMs: 900000,
          max: 100,
        },
      };

      mockConfigService.getAllConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfiguration();

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty("database");
      expect(result.data).toHaveProperty("cors");
      expect(result.data).toHaveProperty("rateLimit");
      expect(result.data.database).toHaveProperty("type");
      expect(result.data.database).toHaveProperty("logging");
    });
  });
});