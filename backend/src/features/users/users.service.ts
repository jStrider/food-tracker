import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { TEMP_USER_ID } from "../../common/constants/temp-user.constant";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ["meals"],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["meals"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: [
        "id",
        "email",
        "name",
        "password",
        "timezone",
        "preferences",
        "createdAt",
        "updatedAt",
      ], // Inclure password pour l'auth
      relations: ["meals"],
    });
  }

  async findByEmailWithoutPassword(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["meals"],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updatePreferences(id: string, preferences: any): Promise<User> {
    const user = await this.findOne(id);
    user.preferences = { ...user.preferences, ...preferences };
    return await this.userRepository.save(user);
  }

  async initDefaultUser(): Promise<{ message: string; user?: User }> {
    // Check if default user already exists
    const existingUser = await this.userRepository.findOne({
      where: { id: TEMP_USER_ID },
    });

    if (existingUser) {
      return { message: "Default user already exists", user: existingUser };
    }

    // Create default user with bcrypt hashed password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash("default123", 10);
    
    const defaultUser = this.userRepository.create({
      id: TEMP_USER_ID,
      email: "default@foodtracker.com",
      name: "Default User",
      password: hashedPassword,
      timezone: "Europe/Paris",
      preferences: {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        dailyCarbGoal: 250,
        dailyFatGoal: 65,
      },
    });

    const savedUser = await this.userRepository.save(defaultUser);
    return { message: "Default user created successfully", user: savedUser };
  }
}
