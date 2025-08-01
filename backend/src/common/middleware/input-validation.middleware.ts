import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import * as DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive input validation middleware for security issue #50
 * Provides server-side validation, sanitization, and security headers
 */
@Injectable()
export class InputValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InputValidationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    this.setSecurityHeaders(res);

    // Validate request size
    this.validateRequestSize(req);

    // Sanitize request body
    this.sanitizeRequestBody(req);

    // Validate common security patterns
    this.validateSecurityPatterns(req);

    // Log security validation
    this.logSecurityValidation(req);

    next();
  }

  /**
   * Set comprehensive security headers
   */
  private setSecurityHeaders(res: Response): void {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove server identification
    res.removeHeader('X-Powered-By');
  }

  /**
   * Validate request size limits
   */
  private validateRequestSize(req: Request): void {
    const contentLength = req.headers['content-length'];
    const maxSize = 10 * 1024 * 1024; // 10MB max request size

    if (contentLength && parseInt(contentLength) > maxSize) {
      this.logger.warn(`Request too large: ${contentLength} bytes from ${req.ip}`);
      throw new BadRequestException('Request payload too large');
    }

    // Check for extremely long URLs
    if (req.url.length > 2048) {
      this.logger.warn(`URL too long: ${req.url.length} chars from ${req.ip}`);
      throw new BadRequestException('URL too long');
    }

    // Check for too many parameters
    const paramCount = Object.keys(req.query).length + Object.keys(req.params).length;
    if (paramCount > 100) {
      this.logger.warn(`Too many parameters: ${paramCount} from ${req.ip}`);
      throw new BadRequestException('Too many parameters');
    }
  }

  /**
   * Sanitize request body to prevent XSS and HTML injection
   */
  private sanitizeRequestBody(req: Request): void {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      // Remove potential script tags and HTML
      return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const cleanKey = key.replace(/[<>]/g, '');
        sanitized[cleanKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate against common security attack patterns
   */
  private validateSecurityPatterns(req: Request): void {
    const suspiciousPatterns = [
      // SQL Injection patterns
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      // Path traversal
      /\.\.\//g,
      /\.\.\\/g,
      // Command injection
      /[;&|`$]/,
      // LDAP injection
      /[()=*!&|]/,
    ];

    const requestString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestString)) {
        this.logger.error(`Suspicious pattern detected: ${pattern} from ${req.ip}`);
        this.logger.error(`Request content: ${requestString.substring(0, 500)}`);
        throw new BadRequestException('Invalid input detected');
      }
    }

    // Check for excessive nested objects (JSON bomb protection)
    if (this.getObjectDepth(req.body) > 10) {
      this.logger.warn(`Deep nested object detected from ${req.ip}`);
      throw new BadRequestException('Request structure too complex');
    }
  }

  /**
   * Calculate object nesting depth
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const currentDepth = this.getObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Log security validation events
   */
  private logSecurityValidation(req: Request): void {
    // Log high-risk endpoints
    const sensitiveEndpoints = ['/auth/', '/users/', '/admin/'];
    const isSensitive = sensitiveEndpoints.some(endpoint => 
      req.path.includes(endpoint)
    );

    if (isSensitive) {
      this.logger.log(`Security validation passed for ${req.method} ${req.path} from ${req.ip}`);
    }

    // Log suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan'];
    
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      this.logger.warn(`Suspicious user agent: ${userAgent} from ${req.ip}`);
    }
  }
}

/**
 * Express-validator chains for common validation patterns
 */
export class ValidationChains {
  /**
   * Email validation chain
   */
  static email(): ValidationChain {
    return body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Invalid email format');
  }

  /**
   * Password validation chain with strength requirements
   */
  static password(): ValidationChain {
    return body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must be 8-128 characters with uppercase, lowercase, number, and special character'
      );
  }

  /**
   * Name validation chain
   */
  static userName(): ValidationChain {
    return body('name')
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z\s\-'.]+$/)
      .withMessage('Name must contain only letters, spaces, hyphens, apostrophes, and periods');
  }

  /**
   * Numeric value validation
   */
  static numericValue(field: string, min: number = 0, max: number = 999999): ValidationChain {
    return body(field)
      .isNumeric()
      .toFloat()
      .isFloat({ min, max })
      .withMessage(`${field} must be a number between ${min} and ${max}`);
  }

  /**
   * Text field validation with length limits
   */
  static textField(field: string, minLength: number = 0, maxLength: number = 1000): ValidationChain {
    return body(field)
      .optional()
      .isLength({ min: minLength, max: maxLength })
      .trim()
      .escape()
      .withMessage(`${field} must be ${minLength}-${maxLength} characters`);
  }

  /**
   * Date validation chain
   */
  static dateField(field: string): ValidationChain {
    return body(field)
      .isISO8601({ strict: true })
      .toDate()
      .withMessage(`${field} must be a valid ISO 8601 date`);
  }

  /**
   * UUID validation chain
   */
  static uuid(field: string): ValidationChain {
    return body(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`);
  }
}

/**
 * Middleware to handle express-validator errors
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const logger = new Logger('ValidationErrors');
    logger.warn(`Validation failed for ${req.method} ${req.path}: ${JSON.stringify(errors.array())}`);
    
    throw new BadRequestException({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
      })),
    });
  }
  
  next();
}