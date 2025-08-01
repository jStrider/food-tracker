import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as validator from 'validator';

/**
 * Input sanitization guard for additional security layer
 * Provides comprehensive input sanitization and malicious content detection
 */
@Injectable()
export class InputSanitizationGuard implements CanActivate {
  private readonly logger = new Logger(InputSanitizationGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Sanitize and validate all inputs
      this.sanitizeRequest(request);
      this.validateInputSecurity(request);
      this.enforceInputLimits(request);

      return true;
    } catch (error) {
      this.logger.error(`Input sanitization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sanitize request inputs
   */
  private sanitizeRequest(request: Request): void {
    // Sanitize body
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Sanitize query parameters
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    // Sanitize URL parameters
    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize property names
        const cleanKey = this.sanitizePropertyName(key);
        sanitized[cleanKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize string values
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Escape HTML entities
    sanitized = validator.escape(sanitized);

    // Remove potential script injections
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove on* event handlers
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

    return sanitized.trim();
  }

  /**
   * Sanitize property names
   */
  private sanitizePropertyName(name: string): string {
    if (typeof name !== 'string') {
      return name;
    }

    // Remove dangerous characters from property names
    const sanitized = name.replace(/[<>]/g, '');

    // Check for prototype pollution attempts
    const dangerousProps = ['__proto__', 'constructor', 'prototype'];
    if (dangerousProps.includes(sanitized.toLowerCase())) {
      throw new BadRequestException(`Invalid property name: ${name}`);
    }

    return sanitized;
  }

  /**
   * Validate input security
   */
  private validateInputSecurity(request: Request): void {
    const allInputs = {
      ...request.body,
      ...request.query,
      ...request.params,
    };

    this.checkForSQLInjection(allInputs);
    this.checkForXSSAttempts(allInputs);
    this.checkForCommandInjection(allInputs);
    this.checkForPathTraversal(allInputs);
    this.checkForLDAPInjection(allInputs);
  }

  /**
   * Check for SQL injection attempts
   */
  private checkForSQLInjection(inputs: any): void {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /'\s*(OR|AND)\s*'[^']*'/i,
      /--\s*$/m,
      /\/\*[\s\S]*?\*\//,
      /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i,
    ];

    this.checkPatterns(inputs, sqlPatterns, 'SQL injection');
  }

  /**
   * Check for XSS attempts
   */
  private checkForXSSAttempts(inputs: any): void {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<\s*\/?\s*(script|object|embed|link|style|img|iframe)/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
    ];

    this.checkPatterns(inputs, xssPatterns, 'XSS');
  }

  /**
   * Check for command injection attempts
   */
  private checkForCommandInjection(inputs: any): void {
    const cmdPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(eval|exec|system|shell_exec|passthru|popen)\b/i,
      /\b(cmd|powershell|bash|sh)\b/i,
      /\|\s*(nc|netcat|curl|wget|ping)\b/i,
    ];

    this.checkPatterns(inputs, cmdPatterns, 'Command injection');
  }

  /**
   * Check for path traversal attempts
   */
  private checkForPathTraversal(inputs: any): void {
    const pathPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.[\\/]/g,
    ];

    this.checkPatterns(inputs, pathPatterns, 'Path traversal');
  }

  /**
   * Check for LDAP injection attempts
   */
  private checkForLDAPInjection(inputs: any): void {
    const ldapPatterns = [
      /[()=*!&|]/,
      /\|\|/,
      /&&/,
      /\*\)/,
      /\)\(/,
    ];

    this.checkPatterns(inputs, ldapPatterns, 'LDAP injection');
  }

  /**
   * Check input against attack patterns
   */
  private checkPatterns(inputs: any, patterns: RegExp[], attackType: string): void {
    const inputString = JSON.stringify(inputs);

    for (const pattern of patterns) {
      if (pattern.test(inputString)) {
        this.logger.error(`${attackType} attempt detected: ${pattern}`);
        this.logger.error(`Input content (first 500 chars): ${inputString.substring(0, 500)}`);
        throw new BadRequestException(`Malicious input detected: ${attackType}`);
      }
    }
  }

  /**
   * Enforce input size and complexity limits
   */
  private enforceInputLimits(request: Request): void {
    // Check overall request size
    const requestSize = JSON.stringify({
      body: request.body,
      query: request.query,
      params: request.params,
    }).length;

    if (requestSize > 1024 * 1024) { // 1MB limit
      this.logger.error(`Request too large: ${requestSize} bytes`);
      throw new BadRequestException('Request payload too large');
    }

    // Check nesting depth
    const maxDepth = Math.max(
      this.getObjectDepth(request.body),
      this.getObjectDepth(request.query),
      this.getObjectDepth(request.params),
    );

    if (maxDepth > 10) {
      this.logger.error(`Object nesting too deep: ${maxDepth} levels`);
      throw new BadRequestException('Object structure too complex');
    }

    // Check array sizes
    this.checkArrayLimits(request.body);
    this.checkArrayLimits(request.query);
    this.checkArrayLimits(request.params);
  }

  /**
   * Calculate object nesting depth
   */
  private getObjectDepth(obj: any, depth: number = 0): number {
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
   * Check array size limits
   */
  private checkArrayLimits(obj: any): void {
    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        throw new BadRequestException('Array too large: maximum 1000 items allowed');
      }
      obj.forEach(item => this.checkArrayLimits(item));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => this.checkArrayLimits(value));
    }
  }
}