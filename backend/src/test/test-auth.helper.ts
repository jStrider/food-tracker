import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../features/users/entities/user.entity';
import { TEMP_USER_ID } from '../common/constants/temp-user.constant';

export class TestAuthHelper {
  static generateToken(user: Partial<User>, jwtService: JwtService): string {
    const payload = { sub: user.id, email: user.email };
    return jwtService.sign(payload);
  }

  static getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  static async createTestUser(dataSource: DataSource): Promise<User> {
    const userRepo = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('test123', 12);
    return userRepo.save({
      id: TEMP_USER_ID,
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    });
  }
}