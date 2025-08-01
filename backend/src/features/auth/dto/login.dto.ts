import { ApiProperty } from "@nestjs/swagger";
import { 
  IsEmail, 
  IsNotEmpty, 
  MaxLength,
  IsString,
  Length
} from "class-validator";
import { Transform } from "class-transformer";

export class LoginDto {
  @ApiProperty({ 
    example: "user@example.com",
    description: "Valid email address",
    maxLength: 254
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @MaxLength(254, { message: "Email must not exceed 254 characters" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    example: "SecureP@ss123",
    description: "Password (8-128 characters)",
    minLength: 8,
    maxLength: 128
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password must be a string" })
  @Length(8, 128, { message: "Password must be between 8 and 128 characters" })
  password: string;
}
