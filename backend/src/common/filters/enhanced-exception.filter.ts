import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { AppException, ApiErrorResponse } from '../errors/custom-exceptions';
import { ErrorCode } from '../errors/error-codes';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
@Catch()
export class EnhancedExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const requestId = request.headers['x-request-id'] as string || uuidv4();
    const userId = (request as any).user?.id;
    const userAgent = request.get('User-Agent');
    const ip = request.ip || request.connection.remoteAddress;

    let statusCode: number;
    let errorResponse: ApiErrorResponse;

    if (exception instanceof AppException) {
      // Our custom application exceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      errorResponse = {
        success: false,
        error: {
          ...exceptionResponse.error,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          requestId,
        },
      };
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      statusCode = exception.getStatus();
      const message = exception.getResponse();
      
      errorResponse = {
        success: false,
        error: {
          code: this.mapHttpStatusToErrorCode(statusCode),
          message: typeof message === 'string' ? message : (message as any).message || 'HTTP Exception',
          details: typeof message === 'object' ? message : undefined,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          statusCode,
          requestId,
        },
      };
    } else if (exception instanceof Error) {
      // Regular JavaScript errors
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      errorResponse = {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : exception.message,
          details: process.env.NODE_ENV === 'development' 
            ? { stack: exception.stack } 
            : undefined,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          statusCode,
          requestId,
        },
      };
    } else {
      // Unknown errors
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      errorResponse = {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Unknown server error',
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          statusCode,
          requestId,
        },
      };
    }

    // Log the error with appropriate level and context
    this.logException(exception, statusCode, request, userId, userAgent, ip, requestId);

    // Add security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Request-ID', requestId);

    response.status(statusCode).json(errorResponse);
  }

  private logException(
    exception: unknown,
    statusCode: number,
    request: Request,
    userId?: string,
    userAgent?: string,
    ip?: string,
    requestId?: string,
  ): void {
    const context = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode,
      userId: userId || 'anonymous',
      userAgent,
      ip,
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
      params: request.params,
    };

    if (statusCode >= 500) {
      // Server errors - these are bugs or system issues
      this.logger.error(
        `💥 Server Error: ${request.method} ${request.url} - ${statusCode}`,
        {
          ...context,
          error: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
          type: 'server_error',
        },
      );
    } else if (statusCode >= 400) {
      // Client errors - these are expected in normal operation
      this.logger.warn(
        `⚠️ Client Error: ${request.method} ${request.url} - ${statusCode}`,
        {
          ...context,
          error: exception instanceof Error ? exception.message : String(exception),
          type: 'client_error',
        },
      );
    } else {
      // Other HTTP status codes (shouldn't normally reach here)
      this.logger.info(
        `ℹ️ HTTP Response: ${request.method} ${request.url} - ${statusCode}`,
        {
          ...context,
          type: 'http_response',
        },
      );
    }

    // Log security events
    if (statusCode === 401 || statusCode === 403) {
      this.logger.logSecurityEvent('Authentication/Authorization failure', {
        ...context,
        securityLevel: statusCode === 401 ? 'medium' : 'high',
      });
    }

    // Log performance issues for 5xx errors that might indicate system problems
    if (statusCode >= 500) {
      this.logger.logPerformance('Error response generation', Date.now() - Date.now(), {
        ...context,
        performanceImpact: 'high',
      });
    }
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private mapHttpStatusToErrorCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case 400:
        return ErrorCode.VALIDATION_FAILED;
      case 401:
        return ErrorCode.AUTH_TOKEN_INVALID;
      case 403:
        return ErrorCode.AUTH_PERMISSION_DENIED;
      case 404:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case 409:
        return ErrorCode.VALIDATION_DUPLICATE_VALUE;
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case 500:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      case 502:
        return ErrorCode.EXTERNAL_API_UNAVAILABLE;
      case 503:
        return ErrorCode.SERVICE_UNAVAILABLE;
      case 504:
        return ErrorCode.OPERATION_TIMEOUT;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}