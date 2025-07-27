import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { User } from "../users/entities/user.entity";

// Mock crypto module
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

// Import the mocked randomBytes
import { randomBytes } from "crypto";

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    password: "$2b$10$hashedpassword",
    timezone: "Europe/Paris",
    preferences: {
      dailyCalorieGoal: 2000,
    },
    roles: ["user"],
    permissions: [],
    meals: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        JWT_SECRET: "test-secret",
        BCRYPT_ROUNDS: 10,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return user without password when credentials are valid", async () => {
      const email = "test@example.com";
      const password = "password123";

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(result?.password).toBeUndefined();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it("should return null when user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(
        "nonexistent@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    it("should return null when password is invalid", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser(
        "test@example.com",
        "wrongpassword",
      );

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token, refresh token and user data on successful login", async () => {
      const loginDto = { email: "test@example.com", password: "password123" };
      const accessToken = "jwt-access-token";
      const refreshToken = "refresh-token-hash";

      jest.spyOn(authService, "validateUser").mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      // Mock crypto.randomBytes for refresh token generation
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(refreshToken),
      } as any);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          timezone: mockUser.timezone,
          preferences: mockUser.preferences,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
        },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          email: mockUser.email,
          sub: mockUser.id,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
          type: "access",
        },
        {
          secret: "test-secret",
          expiresIn: "15m",
        },
      );
    });

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      const loginDto = { email: "test@example.com", password: "wrongpassword" };

      jest.spyOn(authService, "validateUser").mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("register", () => {
    it("should create user and return access token with refresh token on successful registration", async () => {
      const registerDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
        timezone: "UTC",
      };
      const hashedPassword = "$2b$10$newhashpassword";
      const accessToken = "jwt-access-token";
      const refreshToken = "refresh-token-hash";
      const newUser = {
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(() => Promise.resolve(hashedPassword));
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(refreshToken),
      } as any);

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          timezone: newUser.timezone,
          preferences: newUser.preferences,
          roles: newUser.roles,
          permissions: newUser.permissions,
        },
      });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10); // BCRYPT_ROUNDS from config
    });

    it("should throw ConflictException when user already exists", async () => {
      const registerDto = {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123",
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it("should hash password before saving user", async () => {
      const registerDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "plainpassword",
      };
      const hashedPassword = "$2b$10$hashedversion";

      mockUsersService.findByEmail.mockResolvedValue(null);
      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(() => Promise.resolve(hashedPassword));
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        password: hashedPassword,
      });
      mockJwtService.signAsync.mockResolvedValue("token");
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue("refresh-token"),
      } as any);

      await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10); // BCRYPT_ROUNDS from config
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
    });
  });

  describe("getProfile", () => {
    it("should return user profile without password", async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await authService.getProfile(mockUser.id);

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe("refreshTokens", () => {
    it("should return new tokens when refresh token is valid", async () => {
      const refreshToken = "valid-refresh-token";
      const newAccessToken = "new-access-token";
      const newRefreshToken = "new-refresh-token";

      // First, simulate a login to store the refresh token
      jest.spyOn(authService, "validateUser").mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue("initial-access-token");
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(refreshToken),
      } as any);

      await authService.login({ email: mockUser.email, password: "password" });

      // Now test refresh
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(newAccessToken);
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(newRefreshToken),
      } as any);

      const result = await authService.refreshTokens(refreshToken);

      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          timezone: mockUser.timezone,
          preferences: mockUser.preferences,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
        },
      });
    });

    it("should throw ForbiddenException when refresh token is invalid", async () => {
      const invalidToken = "invalid-refresh-token";

      await expect(authService.refreshTokens(invalidToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when refresh token is expired", async () => {
      const expiredToken = "expired-refresh-token";

      // Manually set an expired token in the store
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      (authService as any).refreshTokenStore.set(expiredToken, {
        userId: mockUser.id,
        refreshToken: expiredToken,
        expiresAt: expiredDate,
      });

      await expect(authService.refreshTokens(expiredToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("logout", () => {
    it("should remove refresh token on logout", async () => {
      const refreshToken = "active-refresh-token";

      // Simulate login to store refresh token
      jest.spyOn(authService, "validateUser").mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue("access-token");
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(refreshToken),
      } as any);

      await authService.login({ email: mockUser.email, password: "password" });

      // Logout
      const result = await authService.logout(mockUser.id);

      expect(result).toEqual({ message: "Logout successful" });

      // Verify token is removed
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
