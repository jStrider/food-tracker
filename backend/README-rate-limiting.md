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

### 2. Check Rate Limit Information (Development)
```bash
# POST request to get rate limit info
curl -X POST http://localhost:3001/health/reset-rate-limits

# Response
{
  "status": "info",
  "message": "Rate limits automatically expire based on TTL configuration",
  "ttl": {
    "auth": "1 minute",
    "query": "1 minute", 
    "mutation": "1 minute",
    "default": "1 minute",
    "expensive": "5 minutes",
    "burst": "1 second"
  },
  "note": "Wait for the TTL period to pass, or restart the backend service to reset all counters"
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
1. **Wait for TTL expiry** (1-5 minutes depending on endpoint type)
2. **Check rate limit info** (development):
   ```bash
   curl -X POST http://localhost:3001/health/reset-rate-limits
   ```
3. **Restart backend service** to clear all rate limit counters
4. **Temporary disable** (emergency):
   ```bash
   export DISABLE_RATE_LIMITING=true
   # Restart backend
   ```

### Production Options
```bash
# Disable rate limiting in production (emergency only)
export DISABLE_RATE_LIMITING=true
# Restart service

# Or restart service to clear all rate limit counters
docker restart foodtracker-backend
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