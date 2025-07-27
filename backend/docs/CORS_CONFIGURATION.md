# CORS Configuration Guide

## Overview

This document explains how CORS (Cross-Origin Resource Sharing) is configured in the FoodTracker backend to ensure secure communication between the frontend and backend while preventing unauthorized access.

## Configuration

### Environment Variables

The CORS configuration uses the following environment variables:

- `NODE_ENV`: Determines the environment (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

### Development Environment

In development (`NODE_ENV=development`):
- Automatically allows `http://localhost:3000` and `http://localhost:5173`
- Allows requests without an Origin header (for tools like Postman)
- Uses a 1-hour cache for preflight requests
- Logs CORS configuration for debugging

### Production Environment

In production (`NODE_ENV=production`):
- Only allows origins listed in `ALLOWED_ORIGINS`
- Rejects requests from unauthorized origins
- Uses a 24-hour cache for preflight requests
- No debug logging

## Configuration Examples

### Development
```env
NODE_ENV=development
# ALLOWED_ORIGINS is optional in development
```

### Production
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://app.foodtracker.com,https://www.foodtracker.com
```

### Multiple Environments
```env
# Staging
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.foodtracker.com,https://staging-app.foodtracker.com

# Production with multiple domains
NODE_ENV=production
ALLOWED_ORIGINS=https://foodtracker.com,https://www.foodtracker.com,https://app.foodtracker.com,https://mobile.foodtracker.com
```

## Security Features

1. **Origin Validation**: Only configured origins can access the API
2. **Credentials Support**: Allows cookies and authorization headers
3. **Method Restrictions**: Only allows specific HTTP methods
4. **Header Control**: Limits allowed request headers
5. **Preflight Caching**: Reduces OPTIONS requests in production

## Allowed Configuration

### Methods
- GET, POST, PUT, DELETE, PATCH, OPTIONS

### Headers
- Content-Type
- Authorization
- X-Requested-With
- Accept
- Origin

### Exposed Headers
- X-Total-Count (for pagination)
- X-Page-Count (for pagination)

## Testing

Run CORS tests:
```bash
# Unit tests
npm test cors.config.spec

# E2E tests
npm run test:e2e cors.e2e-spec
```

## Troubleshooting

### Common Issues

1. **"Origin not allowed by CORS" error**
   - Check if the origin is in `ALLOWED_ORIGINS`
   - Ensure no trailing slashes in origins
   - Verify the protocol (http vs https)

2. **Missing CORS headers**
   - Verify `NODE_ENV` is set correctly
   - Check that the backend is running
   - Ensure the request includes an Origin header

3. **Preflight requests failing**
   - Check that OPTIONS method is allowed
   - Verify all required headers are in allowedHeaders

### Debug Mode

To enable CORS debugging in development:
1. Ensure `NODE_ENV=development`
2. Check console logs for "🔒 CORS Configuration"
3. Use browser developer tools to inspect CORS headers

## Mobile App Support

The CORS configuration allows requests without an Origin header to support:
- Mobile applications
- Server-to-server requests
- Development tools

In production, ensure your mobile app is configured to send proper authentication headers instead of relying on CORS.