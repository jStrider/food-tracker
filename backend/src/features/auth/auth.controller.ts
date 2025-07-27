import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthResponseDto, LogoutResponseDto, UserProfileDto } from "./dto/auth-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ 
    status: 200, 
    description: "Login successful",
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post("register")
  @Public()
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ 
    status: 201, 
    description: "User created successfully",
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ 
    status: 200, 
    description: "User profile",
    type: UserProfileDto 
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req): Promise<UserProfileDto> {
    return this.authService.getProfile(req.user.userId);
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: "Refresh access token",
    description: "Use the refresh token to obtain a new access token. This implements token rotation - a new refresh token is also provided."
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: "Tokens refreshed successfully",
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 403, description: "Invalid or expired refresh token" })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refresh_token);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  @ApiResponse({ 
    status: 200, 
    description: "Logout successful",
    type: LogoutResponseDto 
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Request() req): Promise<LogoutResponseDto> {
    return this.authService.logout(req.user.userId);
  }
}
