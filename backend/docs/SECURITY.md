# Security Configuration Guide

## Overview

This guide outlines the security configurations and best practices implemented in the FoodTracker backend.

## Environment Variables

### JWT_SECRET

**CRITICAL**: This is the most important security configuration. 

- **Minimum length**: 32 characters (enforced by validation)
- **Recommended length**: 64+ characters for production
- **Character set**: Must contain a mix of alphanumeric and special characters

#### Generating a Secure JWT Secret

```bash
# Option 1: Using OpenSSL
openssl rand -base64 64

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 3: Using Python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### BCRYPT_ROUNDS

Controls the computational cost of password hashing:

- **Default**: 12 rounds
- **Minimum**: 10 rounds
- **Maximum**: 20 rounds
- **Production recommendation**: 12-14 rounds

Higher values increase security but also increase CPU usage and login time.

## Security Features

### 1. Password Hashing

- Passwords are hashed using bcrypt with configurable rounds
- Salt is automatically generated for each password
- Raw passwords are never stored or logged

### 2. JWT Token Security

- Access tokens expire in 15 minutes by default
- Refresh tokens expire in 7 days
- Token rotation on refresh (old refresh tokens are invalidated)
- No hardcoded fallback secrets - application fails fast if JWT_SECRET is not configured

### 3. Token Payload Enrichment

JWT tokens include:
- User ID (`sub`)
- Email
- Roles (default: `['user']`)
- Permissions (default: `[]`)
- Token type identifier

### 4. Role-Based Access Control (RBAC)

Use decorators to protect endpoints:

```typescript
// Protect endpoint by role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/users')
async getUsers() { }

// Protect by permission
@UseGuards(JwtAuthGuard, RolesGuard)
@Permissions('users.read')
@Get('users/:id')
async getUser() { }
```

### 5. Security Headers

The application includes standard security headers via NestJS security middleware.

## Database Security

### User Table Security

- Password field is excluded from queries by default (`select: false`)
- Roles and permissions stored as JSON arrays
- All user data is properly validated before storage

### Migration Security

Database migrations handle:
- Adding roles/permissions columns with safe defaults
- Proper rollback procedures
- No data exposure during schema changes

## Best Practices

1. **Environment Configuration**
   - Never commit `.env` files
   - Use `.env.example` as a template
   - Validate all environment variables on startup

2. **Authentication Flow**
   - Validate credentials against hashed passwords only
   - Return generic error messages for failed logins
   - Implement rate limiting on auth endpoints

3. **Token Management**
   - Store refresh tokens securely (in-memory with rotation)
   - Clean up expired tokens regularly
   - Invalidate all tokens on password change

4. **Error Handling**
   - Never expose internal errors to clients
   - Log security events for monitoring
   - Use generic error messages for auth failures

## Security Checklist

- [ ] Generate a strong JWT_SECRET for production
- [ ] Configure appropriate BCRYPT_ROUNDS
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up security monitoring/logging
- [ ] Regular dependency updates
- [ ] Security testing in CI/CD pipeline