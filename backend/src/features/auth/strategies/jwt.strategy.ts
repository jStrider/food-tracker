import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"), // No fallback - fail fast if not configured
    });
  }

  async validate(payload: any) {
    // Return enriched user context from JWT payload
    return { 
      userId: payload.sub, 
      email: payload.email,
      roles: payload.roles || ['user'],
      permissions: payload.permissions || [],
      tokenType: payload.type || 'access'
    };
  }
}
