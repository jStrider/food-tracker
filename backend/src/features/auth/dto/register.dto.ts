import { ApiProperty } from "@nestjs/swagger";
import { 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  IsOptional, 
  Matches,
  IsString,
  IsTimeZone,
  Length
} from "class-validator";
import { Transform } from "class-transformer";

export class RegisterDto {
  @ApiProperty({ 
    example: "user@example.com",
    description: "Valid email address (max 254 characters)",
    maxLength: 254
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @MaxLength(254, { message: "Email must not exceed 254 characters" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: "John Doe",
    description: "Full name (2-100 characters, letters, spaces, hyphens, apostrophes only)",
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty({ message: "Name is required" })
  @IsString({ message: "Name must be a string" })
  @Length(2, 100, { message: "Name must be between 2 and 100 characters" })
  @Matches(/^[a-zA-Z\s\-'.]+$/, { 
    message: "Name can only contain letters, spaces, hyphens, apostrophes, and periods" 
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ 
    example: "SecureP@ss123",
    description: "Strong password (8-128 characters with uppercase, lowercase, number, and special character)",
    minLength: 8,
    maxLength: 128
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @Length(8, 128, { message: "Password must be between 8 and 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  })
  password: string;

  @ApiProperty({ 
    example: "Europe/Paris", 
    required: false,
    description: "Valid IANA timezone identifier"
  })
  @IsOptional()
  @IsString({ message: "Timezone must be a string" })
  @IsTimeZone({ message: "Please provide a valid timezone identifier" })
  @MaxLength(50, { message: "Timezone must not exceed 50 characters" })
  timezone?: string;
}
