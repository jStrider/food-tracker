# Rate Limiting Configuration

## Current Limits (After Adjustment)

### Authentication Endpoints (`/auth/*`)
- **Production**: 10 attempts per minute
- **Development**: 20 attempts per minute
- **Window**: 1 minute

### Other Endpoints
- **Default**: 60/120 requests per minute (prod/dev)
- **Mutations**: 30/60 requests per minute (prod/dev)
- **Queries**: 100/200 requests per minute (prod/dev)
- **Expensive operations**: 10 requests per 5 minutes
- **Burst protection**: 10 requests per second

## Emergency Options

### 1. Disable Rate Limiting Completely
```bash
# Set environment variable
export DISABLE_RATE_LIMITING=true
# Restart backend service
```

### 2. Reset Rate Limit Counters (Development)
```bash
# POST request to reset endpoint
curl -X POST http://localhost:3001/health/reset-rate-limits

# Response
{
  "status": "ok",
  "message": "All rate limiting counters have been reset",
  "timestamp": "2025-01-29T..."
}
```

### 3. Check Current Status
```bash
# GET request to health endpoint
curl http://localhost:3001/health

# Response includes rate limiting status
{
  "status": "ok",
  "service": "foodtracker-backend",
  "environment": "development",
  "rateLimitingDisabled": false
}
```

## Troubleshooting

### "Too many requests" Error
1. **Wait 1 minute** for auth limits to reset
2. **Check if in development**:
   ```bash
   curl -X POST http://localhost:3001/health/reset-rate-limits
   ```
3. **Temporary disable** (emergency):
   ```bash
   export DISABLE_RATE_LIMITING=true
   # Restart backend
   ```

### Production Reset (if needed)
```bash
# Enable rate limit reset in production (use with caution)
export ALLOW_RATE_RESET=true
curl -X POST https://your-domain.com/health/reset-rate-limits
```

## Configuration Files
- **Main config**: `src/config/rate-limit.config.ts`
- **Auth decorators**: `src/features/auth/auth.controller.ts`
- **Health endpoint**: `src/common/health.controller.ts`

## Rate Limit Headers
When rate limited, the API returns headers:
- `X-RateLimit-Limit`: Requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp