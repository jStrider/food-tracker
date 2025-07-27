import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockUser = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    timezone: "Europe/Paris",
    preferences: {
      dailyCalorieGoal: 2000,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should return access token and user data on successful login", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "password123",
      };
      const expectedResponse = {
        access_token: "jwt-token",
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it("should propagate error from service", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      await expect(controller.login(loginDto)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("register", () => {
    it("should return access token and user data on successful registration", async () => {
      const registerDto: RegisterDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
        timezone: "UTC",
      };
      const expectedResponse = {
        access_token: "jwt-token",
        user: {
          ...mockUser,
          email: registerDto.email,
          name: registerDto.name,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it("should handle registration without timezone", async () => {
      const registerDto: RegisterDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
      };
      const expectedResponse = {
        access_token: "jwt-token",
        user: {
          ...mockUser,
          email: registerDto.email,
          name: registerDto.name,
          timezone: undefined,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it("should propagate error when user already exists", async () => {
      const registerDto: RegisterDto = {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123",
      };

      mockAuthService.register.mockRejectedValue(new Error("User already exists"));

      await expect(controller.register(registerDto)).rejects.toThrow("User already exists");
    });
  });

  describe("getProfile", () => {
    it("should return user profile for authenticated user", async () => {
      const req = {
        user: {
          userId: mockUser.id,
          email: mockUser.email,
        },
      };

      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith(req.user.userId);
    });

    it("should propagate error from service", async () => {
      const req = {
        user: {
          userId: "invalid-id",
          email: "test@example.com",
        },
      };

      mockAuthService.getProfile.mockRejectedValue(new Error("User not found"));

      await expect(controller.getProfile(req)).rejects.toThrow("User not found");
    });
  });
});