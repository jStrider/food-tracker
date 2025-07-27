import { ApiProperty } from "@nestjs/swagger";

export class UserProfileDto {
  @ApiProperty({ example: "uuid-123" })
  id: string;

  @ApiProperty({ example: "user@example.com" })
  email: string;

  @ApiProperty({ example: "John Doe" })
  name: string;

  @ApiProperty({ example: "America/New_York" })
  timezone: string;

  @ApiProperty({ 
    example: {
      dietary_restrictions: [],
      daily_calorie_goal: 2000
    }
  })
  preferences: any;
}

export class AuthResponseDto {
  @ApiProperty({ 
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token (short-lived, 15 minutes)"
  })
  access_token: string;

  @ApiProperty({ 
    example: "a1b2c3d4e5f6g7h8i9j0...",
    description: "Refresh token for obtaining new access tokens (7 days validity)"
  })
  refresh_token: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: "Logout successful" })
  message: string;
}