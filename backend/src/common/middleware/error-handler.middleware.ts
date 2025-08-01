import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

export interface RequestWithLogger extends Request {
  logger: LoggerService;
  startTime: number;
}

@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: RequestWithLogger, res: Response, next: NextFunction): void {
    // Add logger to request object for use in controllers
    req.logger = this.logger;
    req.startTime = Date.now();

    // Handle unhandled promise rejections at request level
    const originalJson = res.json;
    res.json = function(body: any) {
      // Add consistent response structure for successful requests
      if (body && !body.hasOwnProperty('success')) {
        const successResponse = {
          success: true,
          data: body,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        return originalJson.call(this, successResponse);
      }
      return originalJson.call(this, body);
    };

    next();
  }
}