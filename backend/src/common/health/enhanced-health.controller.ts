import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../features/auth/decorators/public.decorator';
import { SkipRateLimit } from '../decorators/rate-limit.decorator';
import { LoggerService } from '../logger/logger.service';

interface HealthStatus {
  status: 'ok' | 'error' | 'shutting_down';
  timestamp: string;
  service: string;
  environment: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    memory: 'healthy' | 'unhealthy' | 'unknown';
    disk: 'healthy' | 'unhealthy' | 'unknown';
    external_apis: 'healthy' | 'unhealthy' | 'unknown';
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: {
      seconds: number;
      human: string;
    };
    process: {
      pid: number;
      nodeVersion: string;
      platform: string;
    };
  };
  rateLimitingDisabled?: boolean;
}

@ApiTags('health')
@Controller('health')
export class EnhancedHealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private readonly httpHealthIndicator: HttpHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
    private readonly diskHealthIndicator: DiskHealthIndicator,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('HealthController');
  }

  @Get()
  @Public()
  @SkipRateLimit()
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @HealthCheck()
  async check() {
    try {
      const health = await this.healthCheckService.check([
        () => this.typeOrmHealthIndicator.pingCheck('database'),
        () => this.memoryHealthIndicator.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.memoryHealthIndicator.checkRSS('memory_rss', 150 * 1024 * 1024),
        () => this.diskHealthIndicator.checkStorage('storage', { path: '/', threshold: 0.9 }),
      ]);

      const healthStatus: HealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'foodtracker-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: health.details.database?.status === 'up' ? 'healthy' : 'unhealthy',
          memory: health.details.memory_heap?.status === 'up' && health.details.memory_rss?.status === 'up' ? 'healthy' : 'unhealthy',
          disk: health.details.storage?.status === 'up' ? 'healthy' : 'unhealthy',
          external_apis: 'unknown', // Will be checked in detailed endpoint
        },
        metrics: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          },
          uptime: {
            seconds: Math.floor(process.uptime()),
            human: this.formatUptime(process.uptime()),
          },
          process: {
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
          },
        },
        ...(process.env.NODE_ENV === 'development' && {
          rateLimitingDisabled: process.env.DISABLE_RATE_LIMITING === 'true',
        }),
      };

      this.logger.debug('Health check completed successfully', {
        status: healthStatus.status,
        checks: healthStatus.checks,
        memoryUsage: healthStatus.metrics.memory.percentage,
      });

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }

  @Get('detailed')
  @Public()
  @SkipRateLimit()
  @ApiOperation({ summary: 'Detailed health check with external dependencies' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  @ApiResponse({ status: 503, description: 'Service or dependencies are unhealthy' })
  @HealthCheck()
  async detailedCheck() {
    try {
      const health = await this.healthCheckService.check([
        () => this.typeOrmHealthIndicator.pingCheck('database'),
        () => this.memoryHealthIndicator.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.memoryHealthIndicator.checkRSS('memory_rss', 150 * 1024 * 1024),
        () => this.diskHealthIndicator.checkStorage('storage', { path: '/', threshold: 0.9 }),
        // Check external API (OpenFoodFacts)
        () => this.httpHealthIndicator.pingCheck('openfoodfacts', 'https://world.openfoodfacts.org'),
      ]);

      const detailedStatus = {
        ...health,
        service: 'foodtracker-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        detailed_metrics: {
          memory: {
            heap: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
            },
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          },
          cpu: {
            usage: process.cpuUsage(),
            loadAvg: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
          },
          process: {
            pid: process.pid,
            ppid: process.ppid,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            title: process.title,
          },
          system: {
            hostname: require('os').hostname(),
            type: require('os').type(),
            release: require('os').release(),
            totalmem: Math.round(require('os').totalmem() / 1024 / 1024),
            freemem: Math.round(require('os').freemem() / 1024 / 1024),
          },
          database: health.details.database,
          external_apis: {
            openfoodfacts: health.details.openfoodfacts,
          },
        },
      };

      this.logger.info('Detailed health check completed', {
        status: health.status,
        detailsKeys: Object.keys(health.details),
        memoryPercentage: detailedStatus.detailed_metrics.memory.heap.percentage,
      });

      return detailedStatus;
    } catch (error) {
      this.logger.error('Detailed health check failed', {
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }

  @Get('liveness')
  @Public()
  @SkipRateLimit()
  @ApiOperation({ summary: 'Kubernetes liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness() {
    // Simple liveness check - just confirm the service is running
    const response = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    this.logger.debug('Liveness check requested', { uptime: response.uptime });
    return response;
  }

  @Get('readiness')
  @Public()
  @SkipRateLimit()
  @ApiOperation({ summary: 'Kubernetes readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  @HealthCheck()
  async readiness() {
    // Check if service is ready to serve traffic
    try {
      const health = await this.healthCheckService.check([
        () => this.typeOrmHealthIndicator.pingCheck('database'),
        () => this.memoryHealthIndicator.checkHeap('memory_heap', 200 * 1024 * 1024),
      ]);

      const response = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: health.details,
      };

      this.logger.debug('Readiness check passed', { checks: Object.keys(health.details) });
      return response;
    } catch (error) {
      this.logger.warn('Readiness check failed', {
        error: error.message,
        checks: error.causes || [],
      });
      
      throw error;
    }
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}