import { Test, TestingModule } from "@nestjs/testing";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";

describe("ConfigController", () => {
  let controller: ConfigController;
  let configService: ConfigService;

  const mockConfigService = {
    getPublicConfig: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getConfig", () => {
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

      mockConfigService.getPublicConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfig();

      expect(configService.getPublicConfig).toHaveBeenCalled();
      expect(result).toEqual(mockPublicConfig);
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

      mockConfigService.getPublicConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfig();

      expect(result).not.toHaveProperty("jwt");
      expect(result).not.toHaveProperty("secrets");
      expect(result.database).not.toHaveProperty("password");
      expect(result.database).not.toHaveProperty("username");
    });

    it("should handle empty configuration", () => {
      mockConfigService.getPublicConfig.mockReturnValue({});

      const result = controller.getConfig();

      expect(result).toEqual({});
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

      mockConfigService.getPublicConfig.mockReturnValue(mockPublicConfig);

      const result = controller.getConfig();

      expect(result).toHaveProperty("database");
      expect(result).toHaveProperty("cors");
      expect(result).toHaveProperty("rateLimit");
      expect(result.database).toHaveProperty("type");
      expect(result.database).toHaveProperty("logging");
    });
  });
});