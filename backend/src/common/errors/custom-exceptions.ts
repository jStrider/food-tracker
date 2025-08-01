import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from './error-codes';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
    requestId?: string;
  };
}

export class AppException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    customMessage?: string,
  ) {
    const message = customMessage || ErrorMessages[errorCode];
    
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          details,
          statusCode,
        },
      },
      statusCode,
    );
  }
}

// Authentication Exceptions
export class AuthenticationException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.UNAUTHORIZED, details, customMessage);
  }
}

export class AuthorizationException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.FORBIDDEN, details, customMessage);
  }
}

// Validation Exceptions
export class ValidationException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.BAD_REQUEST, details, customMessage);
  }
}

// Resource Exceptions
export class NotFoundException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.NOT_FOUND, details, customMessage);
  }
}

export class ConflictException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.CONFLICT, details, customMessage);
  }
}

// External Service Exceptions
export class ExternalServiceException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.BAD_GATEWAY, details, customMessage);
  }
}

// Database Exceptions
export class DatabaseException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.INTERNAL_SERVER_ERROR, details, customMessage);
  }
}

// Rate Limiting Exceptions
export class RateLimitException extends AppException {
  constructor(details?: any, customMessage?: string) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS, details, customMessage);
  }
}

// System Exceptions
export class SystemException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.INTERNAL_SERVER_ERROR, details, customMessage);
  }
}

export class ServiceUnavailableException extends AppException {
  constructor(details?: any, customMessage?: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE, details, customMessage);
  }
}

// File Exceptions
export class FileException extends AppException {
  constructor(errorCode: ErrorCode, details?: any, customMessage?: string) {
    super(errorCode, HttpStatus.BAD_REQUEST, details, customMessage);
  }
}