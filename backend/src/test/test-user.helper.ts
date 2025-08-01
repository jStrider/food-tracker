/**
 * Test user helper for secure user context in tests
 * Replaces hardcoded user IDs with dynamic generation
 */
import { v4 as uuidv4 } from 'uuid';
import { User } from '../features/users/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Creates a test user with dynamic ID for secure testing
 */
export const createTestUser = async (
  dataSource: DataSource,
  overrides: Partial<User> = {}
): Promise<User> => {
  const userRepository = dataSource.getRepository(User);
  
  const defaultUser = {
    id: uuidv4(), // Dynamic ID generation
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: await bcrypt.hash('testPassword123', 10),
    timezone: 'Europe/Paris',
    preferences: {
      dailyCalorieGoal: 2000,
      dailyProteinGoal: 150,
      dailyCarbGoal: 250,
      dailyFatGoal: 65,
    },
    ...overrides,
  };

  const user = userRepository.create(defaultUser);
  return await userRepository.save(user);
};

/**
 * Creates multiple test users for complex test scenarios
 */
export const createTestUsers = async (
  dataSource: DataSource,
  count: number = 2
): Promise<User[]> => {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(dataSource, {
      email: `testuser${i + 1}-${Date.now()}@example.com`,
      name: `Test User ${i + 1}`,
    });
    users.push(user);
  }
  
  return users;
};

/**
 * Gets the current user ID from JWT payload (for controller tests)
 */
export const getCurrentUserId = (req: any): string => {
  if (!req.user?.userId) {
    throw new Error('User ID not found in request. Ensure JWT auth is properly configured.');
  }
  return req.user.userId;
};

/**
 * Creates a mock request with user context for testing
 */
export const createMockRequestWithUser = (userId?: string) => {
  const actualUserId = userId || uuidv4();
  return {
    user: {
      userId: actualUserId,
      email: `user-${actualUserId}@example.com`,
    },
  };
};