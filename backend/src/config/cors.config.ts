import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const getCorsConfig = (): CorsOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  // Parse allowed origins from environment variable
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];

  // Add default development origins
  if (isDevelopment) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
  }

  // CORS configuration
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: isProduction ? 86400 : 3600, // 24 hours in production, 1 hour in development
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  // Log CORS configuration for debugging
  if (isDevelopment) {
    console.log('🔒 CORS Configuration:', {
      environment: nodeEnv,
      allowedOrigins,
    });
  }

  return corsOptions;
};