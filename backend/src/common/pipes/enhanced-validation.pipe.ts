import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Enhanced validation pipe with comprehensive security validation
 * Extends NestJS ValidationPipe with additional security features
 */
@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(EnhancedValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Pre-validation security checks
    this.performSecurityChecks(value);

    // Transform and validate
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: true, // Remove unknown properties
    });

    const errors = await validate(object, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Enable transformation
      validateCustomDecorators: true,
    });

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints;
        return {
          property: error.property,
          value: error.value,
          messages: constraints ? Object.values(constraints) : ['Unknown validation error'],
        };
      });

      this.logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Perform additional security checks on incoming data
   */
  private performSecurityChecks(value: any): void {
    if (!value || typeof value !== 'object') {
      return;
    }

    // Check for excessive array sizes
    this.checkArraySizes(value);

    // Check for suspicious property names
    this.checkPropertyNames(value);

    // Check for potential prototype pollution
    this.checkPrototypePollution(value);

    // Check string length limits
    this.checkStringLengths(value);
  }

  /**
   * Check for excessively large arrays
   */
  private checkArraySizes(obj: any, path: string = ''): void {
    const MAX_ARRAY_SIZE = 1000;

    if (Array.isArray(obj)) {
      if (obj.length > MAX_ARRAY_SIZE) {
        this.logger.error(`Array too large at path '${path}': ${obj.length} items`);
        throw new BadRequestException(`Array too large: maximum ${MAX_ARRAY_SIZE} items allowed`);
      }

      obj.forEach((item, index) => {
        this.checkArraySizes(item, `${path}[${index}]`);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        this.checkArraySizes(value, path ? `${path}.${key}` : key);
      });
    }
  }

  /**
   * Check for suspicious property names
   */
  private checkPropertyNames(obj: any): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const suspiciousProps = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script',
      'javascript',
    ];

    const checkObject = (object: any, path: string = '') => {
      Object.keys(object).forEach(key => {
        if (suspiciousProps.some(prop => key.toLowerCase().includes(prop))) {
          this.logger.error(`Suspicious property name detected: ${path}.${key}`);
          throw new BadRequestException(`Invalid property name: ${key}`);
        }

        if (object[key] && typeof object[key] === 'object') {
          checkObject(object[key], path ? `${path}.${key}` : key);
        }
      });
    };

    checkObject(obj);
  }

  /**
   * Check for prototype pollution attempts
   */
  private checkPrototypePollution(obj: any): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    const traverse = (object: any, depth: number = 0) => {
      if (depth > 10) {
        // Prevent excessive recursion
        return;
      }

      Object.keys(object).forEach(key => {
        if (dangerousKeys.includes(key)) {
          this.logger.error(`Prototype pollution attempt detected: ${key}`);
          throw new BadRequestException('Invalid object structure detected');
        }

        if (object[key] && typeof object[key] === 'object') {
          traverse(object[key], depth + 1);
        }
      });
    };

    traverse(obj);
  }

  /**
   * Check string lengths to prevent excessive memory usage
   */
  private checkStringLengths(obj: any): void {
    const MAX_STRING_LENGTH = 10000;

    const traverse = (object: any) => {
      if (typeof object === 'string') {
        if (object.length > MAX_STRING_LENGTH) {
          this.logger.error(`String too long: ${object.length} characters`);
          throw new BadRequestException(`String too long: maximum ${MAX_STRING_LENGTH} characters allowed`);
        }
      } else if (Array.isArray(object)) {
        object.forEach(item => traverse(item));
      } else if (object && typeof object === 'object') {
        Object.values(object).forEach(value => traverse(value));
      }
    };

    traverse(obj);
  }
}