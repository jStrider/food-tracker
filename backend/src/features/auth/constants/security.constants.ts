export const SecurityConstants = {
  // Token configuration
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  
  // Password policy
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Bcrypt configuration
  MIN_BCRYPT_ROUNDS: 10,
  MAX_BCRYPT_ROUNDS: 20,
  DEFAULT_BCRYPT_ROUNDS: 12,
  
  // JWT configuration
  MIN_JWT_SECRET_LENGTH: 32,
  RECOMMENDED_JWT_SECRET_LENGTH: 64,
  
  // Default roles and permissions
  DEFAULT_USER_ROLE: 'user',
  DEFAULT_ADMIN_ROLE: 'admin',
  
  // Rate limiting for auth endpoints
  AUTH_RATE_LIMIT_TTL: 60000, // 1 minute
  AUTH_RATE_LIMIT: 5, // 5 attempts per minute
};