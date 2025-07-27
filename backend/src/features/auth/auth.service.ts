import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { User } from "../users/entities/user.entity";

interface RefreshTokenData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  // Map refresh token to data (allows lookup by token)
  private refreshTokenStore: Map<string, RefreshTokenData> = new Map();
  // Map user ID to refresh token (for cleanup on new login)
  private userTokenMap: Map<string, string> = new Map();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles?: string[],
    permissions?: string[],
  ) {
    // Enrich token payload with user context
    const payload = {
      email,
      sub: userId,
      roles: roles || ["user"], // Default role if none provided
      permissions: permissions || [],
      type: "access", // Token type identifier
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"), // No fallback - fail fast if not configured
        expiresIn: "15m", // Short-lived access token
      }),
      this.generateRefreshToken(),
    ]);

    // Clean up any existing refresh token for this user
    const existingToken = this.userTokenMap.get(userId);
    if (existingToken) {
      this.refreshTokenStore.delete(existingToken);
    }

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const tokenData: RefreshTokenData = {
      userId,
      refreshToken,
      expiresAt,
    };

    this.refreshTokenStore.set(refreshToken, tokenData);
    this.userTokenMap.set(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.roles || ["user"],
      user.permissions || [],
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        preferences: user.preferences,
        roles: user.roles || ["user"],
        permissions: user.permissions || [],
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    // Get bcrypt rounds from environment variable with default fallback
    const saltRounds = this.configService.get<number>("BCRYPT_ROUNDS", 12);
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.roles || ["user"],
      user.permissions || [],
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        preferences: user.preferences,
        roles: user.roles || ["user"],
        permissions: user.permissions || [],
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    const { password: _, ...result } = user as any;
    return result;
  }

  async refreshTokens(refreshToken: string) {
    const tokenData = this.refreshTokenStore.get(refreshToken);

    if (!tokenData) {
      throw new ForbiddenException("Invalid refresh token");
    }

    if (tokenData.expiresAt < new Date()) {
      this.refreshTokenStore.delete(refreshToken);
      this.userTokenMap.delete(tokenData.userId);
      throw new ForbiddenException("Refresh token expired");
    }

    // Get user data
    const user = await this.usersService.findOne(tokenData.userId);
    if (!user) {
      throw new ForbiddenException("User not found");
    }

    // Generate new tokens (rotation)
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(
        user.id,
        user.email,
        user.roles || ["user"],
        user.permissions || [],
      );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        preferences: user.preferences,
        roles: user.roles || ["user"],
        permissions: user.permissions || [],
      },
    };
  }

  async logout(userId: string) {
    const refreshToken = this.userTokenMap.get(userId);
    if (refreshToken) {
      this.refreshTokenStore.delete(refreshToken);
      this.userTokenMap.delete(userId);
    }
    return { message: "Logout successful" };
  }

  // Cleanup expired tokens (could be called by a cron job)
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [refreshToken, tokenData] of this.refreshTokenStore.entries()) {
      if (tokenData.expiresAt < now) {
        this.refreshTokenStore.delete(refreshToken);
        this.userTokenMap.delete(tokenData.userId);
      }
    }
  }
}
