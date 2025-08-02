import { DataSource } from "typeorm";
import { User } from "../features/users/entities/user.entity";
import { TEMP_USER_ID } from "../common/constants/temp-user.constant";
import * as bcrypt from "bcrypt";

/**
 * Seed script to create a temporary default user for development
 * This is a temporary solution until proper authentication is implemented
 */
export async function seedTempUser(dataSource: DataSource): Promise<void> {
  try {
    const userRepository = dataSource.getRepository(User);
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { id: TEMP_USER_ID }
    });
    
    if (existingUser) {
      console.log("✅ Default user already exists");
      return;
    }
    
    // Create default user
    const hashedPassword = await bcrypt.hash("default123", 10);
    const defaultUser = userRepository.create({
      id: TEMP_USER_ID,
      email: "default@foodtracker.local",
      name: "Default User",
      password: hashedPassword,
      timezone: "UTC"
    });
    
    await userRepository.save(defaultUser);
    console.log("✅ Created default user: default@foodtracker.local");
    
  } catch (error) {
    console.error("❌ Error creating default user:", error);
    throw error;
  }
}