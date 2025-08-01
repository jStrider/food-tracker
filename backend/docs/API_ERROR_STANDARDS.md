# API Error Handling Standards

## Overview

This document describes the standardized error handling system implemented in the FoodTracker API. All errors follow a consistent structure with proper HTTP status codes, error codes, and detailed logging.

## Error Response Structure

All error responses follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional context-specific information
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "path": "/api/endpoint",
    "method": "POST",
    "statusCode": 400,
    "requestId": "uuid-v4-request-id"
  }
}
```

## Success Response Structure

All successful responses follow this standardized format:

```json
{
  "success": true,
  "data": {
    // Actual response data
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-request-id"
}
```

## Error Categories and Codes

### Authentication & Authorization (AUTH_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid username or password |
| `AUTH_002` | 401 | Authentication token has expired |
| `AUTH_003` | 401 | Invalid authentication token |
| `AUTH_004` | 404 | User not found |
| `AUTH_005` | 409 | User already exists |
| `AUTH_006` | 403 | Permission denied |
| `AUTH_007` | 400 | Password does not meet security requirements |
| `AUTH_008` | 423 | Account is locked due to security reasons |

### Validation (VAL_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VAL_001` | 400 | Validation failed |
| `VAL_002` | 400 | Required field is missing |
| `VAL_003` | 400 | Invalid data format |
| `VAL_004` | 400 | Value is out of acceptable range |
| `VAL_005` | 409 | Duplicate value detected |

### User Management (USER_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_001` | 404 | User not found |
| `USER_002` | 409 | User already exists |
| `USER_003` | 400 | User profile is incomplete |
| `USER_004` | 403 | User account is deactivated |

### Food & Nutrition (FOOD_*, NUTR_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FOOD_001` | 404 | Food item not found |
| `FOOD_002` | 500 | Food search operation failed |
| `FOOD_003` | 500 | Food cache operation failed |
| `FOOD_004` | 502 | External food database API error |
| `NUTR_001` | 500 | Nutrition calculation failed |
| `NUTR_002` | 400 | Nutrition data is incomplete |

### Meal Management (MEAL_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MEAL_001` | 404 | Meal not found |
| `MEAL_002` | 400 | Invalid meal date |
| `MEAL_003` | 409 | Duplicate meal entry |
| `MEAL_004` | 500 | Meal calculation failed |

### Calendar (CAL_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAL_001` | 400 | Invalid calendar date range |
| `CAL_002` | 404 | Calendar data not found |

### Database (DB_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DB_001` | 500 | Database connection failed |
| `DB_002` | 500 | Database query failed |
| `DB_003` | 409 | Database constraint violation |
| `DB_004` | 500 | Database transaction failed |
| `DB_005` | 500 | Database migration failed |

### External Services (EXT_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EXT_001` | 502 | External service is unavailable |
| `EXT_002` | 429 | External API rate limit exceeded |
| `EXT_003` | 502 | Invalid response from external API |
| `EXT_004` | 504 | External API request timeout |

### System (SYS_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SYS_001` | 500 | Internal server error |
| `SYS_002` | 503 | Service temporarily unavailable |
| `SYS_003` | 500 | System configuration error |
| `SYS_004` | 501 | Feature not yet implemented |
| `SYS_005` | 429 | Rate limit exceeded |
| `SYS_006` | 404 | Requested resource not found |
| `SYS_007` | 504 | Operation timed out |

### File & Media (FILE_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FILE_001` | 404 | File not found |
| `FILE_002` | 413 | File size exceeds limit |
| `FILE_003` | 400 | Invalid file format |
| `FILE_004` | 500 | File upload failed |

## Custom Exception Classes

### Available Exception Classes

```typescript
// Base exception class
AppException(errorCode, statusCode?, details?, customMessage?)

// Specialized exception classes
AuthenticationException(errorCode, details?, customMessage?)     // 401
AuthorizationException(errorCode, details?, customMessage?)      // 403
ValidationException(errorCode, details?, customMessage?)         // 400
NotFoundException(errorCode, details?, customMessage?)           // 404
ConflictException(errorCode, details?, customMessage?)          // 409
ExternalServiceException(errorCode, details?, customMessage?)   // 502
DatabaseException(errorCode, details?, customMessage?)          // 500
RateLimitException(details?, customMessage?)                    // 429
SystemException(errorCode, details?, customMessage?)            // 500
ServiceUnavailableException(details?, customMessage?)           // 503
FileException(errorCode, details?, customMessage?)              // 400
```

## Usage Examples

### Basic Usage

```typescript
import { 
  ValidationException, 
  NotFoundException, 
  ErrorCode 
} from '@/common/errors';

// Validation error
throw new ValidationException(
  ErrorCode.VALIDATION_REQUIRED_FIELD,
  { field: 'email' },
  'Email is required for registration'
);

// Not found error
throw new NotFoundException(
  ErrorCode.USER_NOT_FOUND,
  { userId: id }
);
```

### With Logging

```typescript
import { LoggerService } from '@/common/logger';

constructor(private readonly logger: LoggerService) {
  this.logger.setContext('UserService');
}

async findUser(id: string) {
  this.logger.info('Looking up user', { userId: id });
  
  const user = await this.userRepository.findOne(id);
  
  if (!user) {
    this.logger.warn('User not found', { userId: id });
    
    throw new NotFoundException(
      ErrorCode.USER_NOT_FOUND,
      { userId: id, searchAttempted: true }
    );
  }
  
  this.logger.info('User found successfully', { userId: id });
  return user;
}
```

## Logging Standards

### Log Levels

- **ERROR**: System errors, exceptions, failures
- **WARN**: Client errors (4xx), security events, performance issues
- **INFO**: Normal operations, successful requests
- **HTTP**: Request/response logging
- **DEBUG**: Detailed debugging information

### Log Structure

All logs include structured data:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "error",
  "message": "❌ Database query failed",
  "service": "foodtracker-backend",
  "environment": "production",
  "context": "UserService",
  "requestId": "uuid-v4-request-id",
  "userId": "user-123",
  "method": "POST",
  "url": "/api/users",
  "statusCode": 500,
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ...",
  "type": "database_error"
}
```

### Performance Logging

```typescript
// Log slow operations
this.logger.logPerformance('Database query', duration, {
  query: 'SELECT * FROM users',
  threshold: 1000,
  severity: duration > 5000 ? 'high' : 'medium'
});
```

### Security Logging

```typescript
// Log security events
this.logger.logSecurityEvent('Failed login attempt', {
  userId: 'user-123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  securityLevel: 'medium'
});
```

## Response Headers

All API responses include these headers:

- `X-Request-ID`: Unique request identifier for tracing
- `X-Content-Type-Options: nosniff`: Security header
- `X-Frame-Options: DENY`: Security header

Rate-limited endpoints also include:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO 8601)
- `Retry-After`: Seconds to wait (when rate limited)

## Health Check Endpoints

### Basic Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Basic service health
- **Response**: Service status, uptime, environment

### Detailed Health Check
- **Endpoint**: `GET /health/detailed`
- **Purpose**: Comprehensive health including dependencies
- **Response**: Database, memory, disk, external APIs status

### Kubernetes Probes
- **Liveness**: `GET /health/liveness`
- **Readiness**: `GET /health/readiness`

## Best Practices

### For Developers

1. **Always use structured exceptions**: Use custom exception classes with error codes
2. **Include context**: Provide relevant details in the exception details object
3. **Log appropriately**: Use the correct log level and include context
4. **Sanitize sensitive data**: Never log passwords, tokens, or secrets
5. **Use request IDs**: Include request ID in all related logs

### For Frontend Developers

1. **Check success field**: Always check `response.success` before processing data
2. **Use error codes**: Check `response.error.code` for specific error handling
3. **Display user-friendly messages**: Use `response.error.message` for user display
4. **Handle rate limiting**: Check for `429` status and `Retry-After` header
5. **Include request ID**: Use `response.error.requestId` for support requests

### Error Handling Flow

```typescript
try {
  const result = await apiCall();
  if (result.success) {
    return result.data;
  } else {
    // This shouldn't happen with proper API design
    throw new Error('Unexpected response format');
  }
} catch (error) {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    
    switch (apiError.code) {
      case 'AUTH_001':
        // Handle invalid credentials
        break;
      case 'VAL_001':
        // Handle validation errors
        break;
      default:
        // Handle generic error
        break;
    }
  }
}
```

## Monitoring and Alerting

### Log File Locations

- **Error logs**: `logs/error-YYYY-MM-DD.log`
- **Combined logs**: `logs/combined-YYYY-MM-DD.log`
- **Access logs**: `logs/access-YYYY-MM-DD.log`

### Key Metrics to Monitor

- Error rate by endpoint and error code
- Response times (P50, P95, P99)
- Rate limit violations
- External service failures
- Database connection issues
- Memory and disk usage

### Alert Thresholds

- **Critical**: 5xx error rate > 1%
- **Warning**: 4xx error rate > 5%
- **Info**: Average response time > 500ms
- **Security**: Multiple failed auth attempts from same IP