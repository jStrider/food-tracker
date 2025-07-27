import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ 
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "The refresh token received from login or previous refresh"
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}