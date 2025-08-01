import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  
  return {
    type: 'postgres' as const,
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USER', 'foodtracker'),
    password: configService.get<string>(
      'DATABASE_PASSWORD',
      'foodtracker_secure_password',
    ),
    database: configService.get<string>('DATABASE_NAME', 'foodtracker'),
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/database/migrations/*.js'],
    migrationsTableName: 'typeorm_migrations',
    synchronize: !isProduction, // Never sync in production
    
    // Logging configuration
    logging: configService.get<string>('DB_LOGGING') === 'true' && !isProduction,
    logger: isProduction ? 'simple-console' : 'advanced-console',
    maxQueryExecutionTime: 1000, // Log queries taking longer than 1 second
    
    // Connection pool optimization
    poolSize: configService.get<number>('DATABASE_POOL_SIZE', isProduction ? 25 : 10),
    connectTimeoutMS: configService.get<number>('DATABASE_CONNECT_TIMEOUT', 10000),
    
    // SSL configuration
    ssl: configService.get('DATABASE_SSL') === 'true'
      ? { rejectUnauthorized: false }
      : false,
      
    // Query optimization
    cache: isProduction ? {
      type: 'database',
      tableName: 'typeorm_cache',
      duration: 30000, // 30 seconds
    } : false,
    
    // Additional performance optimizations
    extra: {
      // Connection pool settings
      max: isProduction ? 25 : 10,
      min: isProduction ? 5 : 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      
      // Query performance
      statement_timeout: '30s',
      query_timeout: 30000,
      
      // Connection settings
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
  };
};

// Export alias for backward compatibility
export const getOptimizedTypeOrmConfig = getTypeOrmConfig;