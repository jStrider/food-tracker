import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { User } from "../users/entities/user.entity";

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
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(result?.password).toBeUndefined();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it("should return null when user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser("nonexistent@example.com", "password");

      expect(result).toBeNull();
    });

    it("should return null when password is invalid", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser("test@example.com", "wrongpassword");

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token and user data on successful login", async () => {
      const loginDto = { email: "test@example.com", password: "password123" };
      const token = "jwt-token";

      jest.spyOn(authService, "validateUser").mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          timezone: mockUser.timezone,
          preferences: mockUser.preferences,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      const loginDto = { email: "test@example.com", password: "wrongpassword" };

      jest.spyOn(authService, "validateUser").mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("register", () => {
    it("should create user and return access token on successful registration", async () => {
      const registerDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
        timezone: "UTC",
      };
      const hashedPassword = "$2b$10$newhashpassword";
      const token = "jwt-token";
      const newUser = { ...mockUser, email: registerDto.email, name: registerDto.name };

      mockUsersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, "hash").mockImplementation(() => Promise.resolve(hashedPassword));
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          timezone: newUser.timezone,
          preferences: newUser.preferences,
        },
      });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it("should throw ConflictException when user already exists", async () => {
      const registerDto = {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123",
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
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
      jest.spyOn(bcrypt, "hash").mockImplementation(() => Promise.resolve(hashedPassword));
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        password: hashedPassword,
      });
      mockJwtService.sign.mockReturnValue("token");

      await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
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
});