import { createLogger, format, transports, Logger } from 'winston';
import 'winston-daily-rotate-file';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  error?: string;
  stack?: string;
  [key: string]: any;
}

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

const consoleFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.colorize(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

export const createAppLogger = (): Logger => {
  const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
      service: 'foodtracker-backend',
      environment: process.env.NODE_ENV || 'development',
    },
    transports: [
      // Error logs
      new transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
        maxSize: '20m',
        format: logFormat,
      }),
      
      // Combined logs
      new transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        maxSize: '20m',
        format: logFormat,
      }),
      
      // HTTP access logs
      new transports.DailyRotateFile({
        filename: 'logs/access-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        maxFiles: '7d',
        maxSize: '20m',
        format: logFormat,
      }),
    ],
  });

  // Console logging in development
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      format: consoleFormat,
    }));
  }

  // Create logs directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return logger;
};

export const appLogger = createAppLogger();