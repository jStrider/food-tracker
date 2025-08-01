import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnhancedLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('RequestLogger');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const requestId = request.headers['x-request-id'] as string || uuidv4();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.id;
    const ip = request.ip || request.connection.remoteAddress;
    
    // Add request ID to headers for tracing
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest(method, url, userId, {
      requestId,
      userAgent,
      ip,
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
      params: request.params,
      contentType: request.get('Content-Type'),
      contentLength: request.get('Content-Length'),
    });

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        // Log successful response
        this.logger.logResponse(method, url, statusCode, responseTime, userId, {
          requestId,
          userAgent,
          ip,
          responseSize: this.getResponseSize(data),
          contentType: response.get('Content-Type'),
        });

        // Log performance warnings for slow requests
        if (responseTime > 1000) {
          this.logger.logPerformance(`Slow request: ${method} ${url}`, responseTime, {
            requestId,
            userId,
            statusCode,
            threshold: 1000,
            severity: responseTime > 5000 ? 'high' : 'medium',
          });
        }

        // Log database performance if applicable
        if (this.isDatabaseOperation(url)) {
          this.logger.logDatabaseOperation(`${method} ${url}`, this.extractTableFromUrl(url), {
            requestId,
            userId,
            responseTime,
            statusCode,
          });
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        
        // Error will be logged by the exception filter, but we can add request context
        this.logger.error(`Request failed: ${method} ${url}`, {
          requestId,
          userId,
          userAgent,
          ip,
          responseTime,
          error: error.message,
          type: 'request_error',
        });

        throw error;
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private isDatabaseOperation(url: string): boolean {
    // Check if the URL suggests a database operation
    return /\/(users|meals|foods|nutrition|calendar)/.test(url);
  }

  private extractTableFromUrl(url: string): string {
    const match = url.match(/\/(users|meals|foods|nutrition|calendar)/);
    return match ? match[1] : 'unknown';
  }
}