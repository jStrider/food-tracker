import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
// SECURITY FIX: TEMP_USER_ID removed - using proper authentication context

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

  // SECURITY FIX: initDefaultUser method removed
  // Use proper user creation with authentication context instead
}
