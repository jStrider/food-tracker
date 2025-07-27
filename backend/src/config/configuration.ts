export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3001,
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  database: {
    path: process.env.DATABASE_PATH || 'data/foodtracker.db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  externalApis: {
    openFoodFacts: {
      baseUrl: process.env.OPENFOODFACTS_API_URL || 'https://world.openfoodfacts.org/api/v0',
    },
  },
  
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  health: {
    endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
  },
});