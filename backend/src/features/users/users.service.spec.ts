import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
// SECURITY FIX: TEMP_USER_ID removed for security

describe("UsersService", () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    password: "hashedPassword",
    timezone: "UTC",
    preferences: {
      dailyCalorieGoal: 2000,
      dailyProteinGoal: 150,
      dailyCarbGoal: 250,
      dailyFatGoal: 65,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    meals: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto: CreateUserDto = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        timezone: "Europe/Paris",
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe("findAll", () => {
    it("should return all users with meals relation", async () => {
      const users = [mockUser];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ["meals"],
      });
      expect(result).toEqual(users);
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne("user-1");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "user-1" },
        relations: ["meals"],
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        new NotFoundException("User with ID nonexistent not found"),
      );
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email with password", async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: [
          "id",
          "email",
          "name",
          "password",
          "timezone",
          "preferences",
          "createdAt",
          "updatedAt",
        ],
        relations: ["meals"],
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findByEmailWithoutPassword", () => {
    it("should return a user by email without password", async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmailWithoutPassword("test@example.com");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        relations: ["meals"],
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByEmailWithoutPassword("nonexistent@example.com"),
      ).rejects.toThrow(
        new NotFoundException("User with email nonexistent@example.com not found"),
      );
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateUserDto: UpdateUserDto = {
        name: "Updated User",
        timezone: "America/New_York",
      };

      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(service, "findOne").mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update("user-1", updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith("user-1");
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe("remove", () => {
    it("should remove a user", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.remove("user-1");

      expect(service.findOne).toHaveBeenCalledWith("user-1");
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("updatePreferences", () => {
    it("should update user preferences", async () => {
      const newPreferences = {
        dailyCalorieGoal: 2200,
        dailyProteinGoal: 160,
      };

      const updatedUser = {
        ...mockUser,
        preferences: { ...mockUser.preferences, ...newPreferences },
      };

      jest.spyOn(service, "findOne").mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updatePreferences("user-1", newPreferences);

      expect(service.findOne).toHaveBeenCalledWith("user-1");
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });
  });

  // SECURITY FIX: initDefaultUser tests removed since method was removed for security
});