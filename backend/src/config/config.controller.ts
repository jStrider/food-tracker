import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppConfigService } from './config.service';

@ApiTags('Configuration')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get application configuration',
    description: 'Returns non-sensitive configuration information for debugging and monitoring'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          properties: {
            nodeEnv: { type: 'string', example: 'development' },
            port: { type: 'number', example: 3001 },
            corsOrigin: { type: 'string', example: 'http://localhost:3000' },
          },
        },
        database: {
          type: 'object',
          properties: {
            path: { type: 'string', example: 'data/foodtracker.db' },
          },
        },
        jwt: {
          type: 'object',
          properties: {
            expiresIn: { type: 'string', example: '24h' },
            hasSecret: { type: 'boolean', example: true },
            secretLength: { type: 'number', example: 64 },
          },
        },
        externalApis: {
          type: 'object',
          properties: {
            openFoodFacts: { type: 'string', example: 'https://world.openfoodfacts.org/api/v0' },
          },
        },
        throttle: {
          type: 'object',
          properties: {
            ttl: { type: 'number', example: 60000 },
            limit: { type: 'number', example: 100 },
          },
        },
        logging: {
          type: 'object',
          properties: {
            level: { type: 'string', example: 'info' },
          },
        },
        health: {
          type: 'object',
          properties: {
            endpoint: { type: 'string', example: '/health' },
          },
        },
      },
    },
  })
  getConfiguration() {
    return {
      message: 'Configuration retrieved successfully',
      data: this.configService.getAllConfig(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('validate')
  @ApiOperation({ 
    summary: 'Validate configuration',
    description: 'Validates the current configuration and returns any issues'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration validation completed',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        issues: { 
          type: 'array',
          items: { type: 'string' }
        },
        warnings: { 
          type: 'array',
          items: { type: 'string' }
        },
      },
    },
  })
  validateConfiguration() {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Critical validations
    if (!this.configService.getJwtSecret()) {
      issues.push('JWT_SECRET is not configured');
    } else if (this.configService.getJwtSecret().length < 32) {
      issues.push('JWT_SECRET is too short (minimum 32 characters)');
    }

    if (!this.configService.getDatabasePath()) {
      issues.push('DATABASE_PATH is not configured');
    }

    // Warnings for development
    if (this.configService.isDevelopment()) {
      if (this.configService.getJwtSecret() === 'your-super-secure-jwt-secret-key-here-minimum-32-characters') {
        warnings.push('Using default JWT_SECRET (acceptable in development)');
      }
    }

    // Warnings for production
    if (this.configService.isProduction()) {
      if (this.configService.getJwtSecret() === 'your-super-secure-jwt-secret-key-here-minimum-32-characters') {
        issues.push('Using default JWT_SECRET in production (security risk)');
      }

      if (this.configService.getDatabasePath().includes('data/')) {
        warnings.push('Using local database in production (consider external database)');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      environment: this.configService.getNodeEnv(),
      timestamp: new Date().toISOString(),
    };
  }
}