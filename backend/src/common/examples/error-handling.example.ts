/**
 * Error Handling Examples
 * 
 * This file demonstrates how to use the enhanced error handling system
 * with custom exceptions, error codes, and structured logging.
 */

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerService } from '../logger/logger.service';
import {
  AuthenticationException,
  AuthorizationException,
  ValidationException,
  NotFoundException,
  ConflictException,
  ExternalServiceException,
  DatabaseException,
  SystemException,
} from '../errors/custom-exceptions';
import { ErrorCode } from '../errors/error-codes';

@ApiTags('examples')
@Controller('examples/errors')
export class ErrorHandlingExampleController {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ErrorHandlingExample');
  }

  @Get('auth-error')
  @ApiOperation({ summary: 'Demonstrate authentication error' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async authError() {
    // Log the security event
    this.logger.logSecurityEvent('Invalid authentication attempt', {
      endpoint: '/examples/errors/auth-error',
      reason: 'example_demonstration',
    });

    // Throw custom authentication exception
    throw new AuthenticationException(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      { attemptedUsername: 'example@user.com' },
      'Custom message: Invalid login credentials provided'
    );
  }

  @Get('validation-error')
  @ApiOperation({ summary: 'Demonstrate validation error' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async validationError() {
    // Log validation attempt
    this.logger.warn('Validation error demonstration', {
      endpoint: '/examples/errors/validation-error',
      validationRules: ['email', 'password_strength'],
    });

    // Throw validation exception with detailed field errors
    throw new ValidationException(
      ErrorCode.VALIDATION_FAILED,
      {
        fields: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too weak' },
        ],
        providedData: { email: 'invalid-email', password: '123' },
      }
    );
  }

  @Get('not-found/:id')
  @ApiOperation({ summary: 'Demonstrate not found error' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async notFoundError(@Param('id') id: string) {
    // Log the lookup attempt
    this.logger.info('Resource lookup attempted', {
      resourceType: 'user',
      resourceId: id,
      endpoint: '/examples/errors/not-found',
    });

    // Throw not found exception
    throw new NotFoundException(
      ErrorCode.USER_NOT_FOUND,
      { userId: id, searchAttempted: true },
      `User with ID ${id} was not found`
    );
  }

  @Post('conflict')
  @ApiOperation({ summary: 'Demonstrate conflict error' })
  @ApiResponse({ status: 409, description: 'Resource conflict' })
  async conflictError(@Body() body: { email: string }) {
    // Log the conflict
    this.logger.warn('Resource conflict detected', {
      resourceType: 'user',
      conflictField: 'email',
      attemptedValue: body.email,
    });

    // Throw conflict exception
    throw new ConflictException(
      ErrorCode.USER_ALREADY_EXISTS,
      {
        conflictingField: 'email',
        existingResource: { id: 123, email: body.email },
      }
    );
  }

  @Get('external-service-error')
  @ApiOperation({ summary: 'Demonstrate external service error' })
  @ApiResponse({ status: 502, description: 'External service error' })
  async externalServiceError() {
    // Log external service interaction
    this.logger.error('External service call failed', {
      service: 'OpenFoodFacts',
      endpoint: 'https://world.openfoodfacts.org/api/v0/product/123',
      timeout: 5000,
    });

    // Throw external service exception
    throw new ExternalServiceException(
      ErrorCode.EXTERNAL_API_UNAVAILABLE,
      {
        service: 'OpenFoodFacts',
        endpoint: '/api/v0/product/123',
        lastSuccessfulCall: '2024-01-01T12:00:00Z',
        retryAfter: 300,
      }
    );
  }

  @Get('database-error')
  @ApiOperation({ summary: 'Demonstrate database error' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async databaseError() {
    // Log database operation
    this.logger.logDatabaseOperation('SELECT', 'users', {
      query: 'SELECT * FROM users WHERE id = ?',
      parameters: [999],
    });

    // Simulate database error
    this.logger.error('Database query failed', {
      operation: 'SELECT',
      table: 'users',
      error: 'Connection timeout',
      queryDuration: 30000,
    });

    // Throw database exception
    throw new DatabaseException(
      ErrorCode.DATABASE_QUERY_ERROR,
      {
        query: 'SELECT * FROM users WHERE id = ?',
        parameters: [999],
        error: 'Connection timeout after 30 seconds',
        table: 'users',
      }
    );
  }

  @Get('system-error')
  @ApiOperation({ summary: 'Demonstrate system error' })
  @ApiResponse({ status: 500, description: 'Internal system error' })
  async systemError() {
    // Log system performance issue
    this.logger.logPerformance('Critical system operation', 15000, {
      operation: 'memory_allocation',
      threshold: 1000,
      severity: 'critical',
    });

    // Throw system exception
    throw new SystemException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        subsystem: 'memory_manager',
        operationId: 'alloc_001',
        memoryUsage: {
          before: '1.2GB',
          attempted: '2.5GB',
          available: '1.8GB',
        },
      }
    );
  }

  @Get('success-example')
  @ApiOperation({ summary: 'Demonstrate successful response structure' })
  @ApiResponse({ status: 200, description: 'Successful operation' })
  async successExample() {
    // Log successful operation
    this.logger.info('Successful operation completed', {
      operation: 'example_success',
      duration: 45,
    });

    // Return data - will be wrapped by ErrorHandlerMiddleware
    return {
      message: 'Operation completed successfully',
      data: {
        id: 123,
        name: 'Example Resource',
        status: 'active',
      },
      metadata: {
        processedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  @Get('performance-logging')
  @ApiOperation({ summary: 'Demonstrate performance logging' })
  @ApiResponse({ status: 200, description: 'Performance metrics logged' })
  async performanceLogging() {
    const startTime = Date.now();
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    this.logger.logPerformance('Simulated operation', duration, {
      operationType: 'data_processing',
      itemsProcessed: 150,
      cacheHit: true,
    });

    return {
      operation: 'completed',
      duration,
      performance: 'logged',
    };
  }
}