import { Injectable, Scope } from '@nestjs/common';
import { Logger } from 'winston';
import { appLogger, LogLevel, LogContext } from './logger.config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private context?: string;
  private logger: Logger = appLogger;

  setContext(context: string): void {
    this.context = context;
  }

  private formatMessage(message: string, context?: LogContext): [string, any] {
    const logContext = {
      ...context,
      ...(this.context && { context: this.context }),
    };
    
    return [message, logContext];
  }

  error(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.error(msg, ctx);
  }

  warn(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.warn(msg, ctx);
  }

  info(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.info(msg, ctx);
  }

  http(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.http(msg, ctx);
  }

  debug(message: string, context?: LogContext): void {
    const [msg, ctx] = this.formatMessage(message, context);
    this.logger.debug(msg, ctx);
  }

  // Convenience methods for common scenarios
  logRequest(method: string, url: string, userId?: string, context?: Partial<LogContext>): void {
    this.http(`🔄 ${method} ${url}`, {
      method,
      url,
      userId: userId || 'anonymous',
      type: 'request',
      ...context,
    });
  }

  logResponse(method: string, url: string, statusCode: number, responseTime: number, userId?: string, context?: Partial<LogContext>): void {
    const level = statusCode >= 400 ? 'warn' : 'http';
    const emoji = statusCode >= 500 ? '💥' : statusCode >= 400 ? '⚠️' : '✅';
    
    this[level](`${emoji} ${method} ${url} - ${statusCode} - ${responseTime}ms`, {
      method,
      url,
      statusCode,
      responseTime,
      userId: userId || 'anonymous',
      type: 'response',
      ...context,
    });
  }

  logError(error: Error, context?: Partial<LogContext>): void {
    this.error(`❌ ${error.message}`, {
      error: error.message,
      stack: error.stack,
      type: 'error',
      ...context,
    });
  }

  logSecurityEvent(event: string, context?: Partial<LogContext>): void {
    this.warn(`🔒 Security Event: ${event}`, {
      type: 'security',
      event,
      ...context,
    });
  }

  logDatabaseOperation(operation: string, table: string, context?: Partial<LogContext>): void {
    this.debug(`💾 Database: ${operation} on ${table}`, {
      type: 'database',
      operation,
      table,
      ...context,
    });
  }

  logPerformance(operation: string, duration: number, context?: Partial<LogContext>): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    const emoji = duration > 1000 ? '🐌' : '⚡';
    
    this[level](`${emoji} Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...context,
    });
  }
}