# Environment Variables Documentation

This document describes all environment variables used by the FoodTracker application, including their purpose, validation rules, and security considerations.

## 🚨 Critical Security Variables

### JWT_SECRET (Required)
- **Purpose**: Secret key for JWT token signing and verification
- **Type**: String (minimum 32 characters)
- **Default**: None (must be provided)
- **Example**: `JWT_SECRET=ZnJhbmNvaXNfbGVfZ3JhbmRfZGV2ZWxvcHBlcl9zZWNyZXRfa2V5XzMyX2NoYXJz`
- **Security**: 🚨 **CRITICAL** - Use a strong, randomly generated secret in production
- **Generate**: `openssl rand -base64 32`

### JWT_EXPIRES_IN
- **Purpose**: JWT token expiration time
- **Type**: String (duration format: number + unit)
- **Default**: `24h`
- **Valid units**: `s` (seconds), `m` (minutes), `h` (hours), `d` (days)
- **Examples**: `30m`, `24h`, `7d`

## 📱 Application Configuration

### NODE_ENV
- **Purpose**: Application environment
- **Type**: String (enum)
- **Default**: `development`
- **Valid values**: `development`, `production`, `test`
- **Impact**: Affects logging, error handling, and security validations

### PORT
- **Purpose**: Port on which the application runs
- **Type**: Number (valid port range)
- **Default**: `3001`
- **Range**: 1-65535

### CORS_ORIGIN
- **Purpose**: Allowed CORS origins
- **Type**: String (comma-separated for multiple origins)
- **Default**: `http://localhost:3000`
- **Examples**: 
  - Single: `https://myapp.com`
  - Multiple: `https://myapp.com,https://app.myapp.com`

## 🗄️ Database Configuration

### DATABASE_PATH
- **Purpose**: Path to SQLite database file
- **Type**: String (file path)
- **Default**: `data/foodtracker.db`
- **Notes**: 
  - Directory will be created if it doesn't exist
  - Use absolute paths in production

## 🌐 External APIs

### OPENFOODFACTS_API_URL
- **Purpose**: Base URL for OpenFoodFacts API
- **Type**: String (valid URL)
- **Default**: `https://world.openfoodfacts.org/api/v0`
- **Notes**: Alternative endpoints available for different regions

## 🛡️ Rate Limiting

### THROTTLE_TTL
- **Purpose**: Rate limiting time window in milliseconds
- **Type**: Number (positive)
- **Default**: `60000` (1 minute)
- **Examples**: `60000` (1 min), `300000` (5 min)

### THROTTLE_LIMIT
- **Purpose**: Maximum requests per time window
- **Type**: Number (positive)
- **Default**: `100`
- **Notes**: Adjust based on expected traffic

## 📊 Logging

### LOG_LEVEL
- **Purpose**: Application logging level
- **Type**: String (enum)
- **Default**: `info`
- **Valid values**: `error`, `warn`, `info`, `debug`
- **Impact**: 
  - `error`: Only errors
  - `warn`: Errors and warnings
  - `info`: Standard operational info
  - `debug`: Detailed debugging info

## 🏥 Health Check

### HEALTH_CHECK_ENDPOINT
- **Purpose**: Health check endpoint path
- **Type**: String (URL path)
- **Default**: `/health`
- **Notes**: Used by monitoring and load balancers

## 🔧 Development Variables

### DB_LOGGING
- **Purpose**: Enable database query logging (development only)
- **Type**: Boolean
- **Default**: `true` (development), `false` (production)
- **Values**: `true`, `false`

### DB_SYNCHRONIZE
- **Purpose**: Enable automatic schema synchronization (development only)
- **Type**: Boolean
- **Default**: `true` (development), `false` (production)
- **⚠️ Warning**: **NEVER** use in production - will cause data loss

## 🐳 Docker Configuration

### COMPOSE_PROJECT_NAME
- **Purpose**: Docker Compose project name
- **Type**: String
- **Default**: `foodtracker`
- **Notes**: Used to isolate Docker resources

### Legacy Variables (Backward Compatibility)
- `BACKEND_PORT`: Same as `PORT`
- `FRONTEND_PORT`: Frontend port (Docker only)
- `BACKEND_URL`: Backend URL (Docker only)
- `FRONTEND_URL`: Frontend URL (Docker only)

## 🚀 Production Variables

### SSL/TLS Configuration (Optional)
```bash
# SSL certificate and private key paths
SSL_CERT_PATH=/path/to/certificate.pem
SSL_KEY_PATH=/path/to/private-key.pem
```

### Database Migrations
```bash
# Path to compiled migration files
DB_MIGRATIONS_PATH=dist/database/migrations/*.js
```

## 📋 Environment Files

### .env.development
```bash
NODE_ENV=development
JWT_SECRET=your-development-secret-32-chars
LOG_LEVEL=debug
DB_LOGGING=true
DB_SYNCHRONIZE=true
```

### .env.production
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-production-secret
LOG_LEVEL=info
DB_LOGGING=false
DB_SYNCHRONIZE=false
SSL_CERT_PATH=/etc/ssl/certs/app.pem
SSL_KEY_PATH=/etc/ssl/private/app.key
```

### .env.test
```bash
NODE_ENV=test
JWT_SECRET=test-secret-32-characters-long
DATABASE_PATH=:memory:
LOG_LEVEL=error
```

## ✅ Validation

The application includes comprehensive environment validation that:

1. **Validates on startup**: All variables are checked when the application starts
2. **Provides clear errors**: Descriptive error messages for invalid configurations
3. **Security checks**: Warns about insecure configurations
4. **Type validation**: Ensures correct data types and formats

### Validation Endpoints

- `GET /config`: View current configuration (secrets hidden)
- `GET /config/validate`: Validate configuration and get issues/warnings

## 🔒 Security Best Practices

1. **Never commit secrets**: Use `.env` files that are git-ignored
2. **Use strong secrets**: Generate random keys with proper entropy
3. **Environment-specific configs**: Different settings for dev/staging/prod
4. **Secrets management**: Use proper secrets management in production
5. **Regular rotation**: Rotate secrets regularly
6. **Minimal permissions**: Database and API keys should have minimal required permissions

## 🛠️ Troubleshooting

### Common Issues

1. **JWT_SECRET too short**: Must be at least 32 characters
2. **Invalid NODE_ENV**: Must be `development`, `production`, or `test`
3. **Port conflicts**: Ensure PORT is not in use by another application
4. **Database permissions**: Ensure write permissions for DATABASE_PATH directory
5. **CORS issues**: Verify CORS_ORIGIN matches your frontend URL

### Debug Commands

```bash
# Check current configuration
curl http://localhost:3001/config

# Validate configuration
curl http://localhost:3001/config/validate

# Test JWT generation
openssl rand -base64 32
```

## 📚 References

- [Environment Variable Best Practices](https://12factor.net/config)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)