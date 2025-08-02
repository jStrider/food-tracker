import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { InputValidationMiddleware } from './input-validation.middleware';

describe('InputValidationMiddleware', () => {
  let middleware: InputValidationMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InputValidationMiddleware],
    }).compile();

    middleware = module.get<InputValidationMiddleware>(InputValidationMiddleware);

    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'POST',
      url: '/api/test',
      headers: {},
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('Security Headers', () => {
    it('should set comprehensive security headers', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Request Size Validation', () => {
    it('should reject requests that are too large', () => {
      mockRequest.headers = {
        'content-length': (11 * 1024 * 1024).toString(), // 11MB
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should reject URLs that are too long', () => {
      mockRequest.url = 'a'.repeat(2049);

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should reject requests with too many parameters', () => {
      const query: any = {};
      for (let i = 0; i < 101; i++) {
        query[`param${i}`] = 'value';
      }
      mockRequest.query = query;

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content from request body', () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>John Doe',
        description: '<iframe src="evil.com"></iframe>Safe content',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.description).not.toContain('<iframe>');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      mockRequest.body = {
        user: {
          profile: {
            bio: '<script>evil()</script>Clean bio',
          },
        },
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.user.profile.bio).not.toContain('<script>');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      mockRequest.body = {
        tags: ['<script>alert(1)</script>tag1', 'clean-tag'],
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.tags[0]).not.toContain('<script>');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Security Pattern Detection', () => {
    it('should detect SQL injection patterns', () => {
      mockRequest.body = {
        query: "'; DROP TABLE users; --",
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should detect XSS patterns', () => {
      mockRequest.body = {
        content: '<script>alert("xss")</script>',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should detect path traversal patterns', () => {
      mockRequest.body = {
        file: '../../../etc/passwd',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should detect command injection patterns', () => {
      mockRequest.body = {
        command: 'ls; rm -rf /',
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });
  });

  describe('Object Depth Validation', () => {
    it('should reject deeply nested objects', () => {
      // Create an object with depth > 10
      let deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 12; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = 'deep';

      mockRequest.body = deepObject;

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).toThrow(BadRequestException);
    });

    it('should accept normally nested objects', () => {
      mockRequest.body = {
        level1: {
          level2: {
            level3: {
              value: 'acceptable depth',
            },
          },
        },
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).not.toThrow();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log validation for sensitive endpoints', () => {
      const logSpy = jest.spyOn(middleware['logger'], 'log');
      const testRequest = { ...mockRequest, path: '/auth/login' };

      middleware.use(testRequest as Request, mockResponse as Response, nextFunction);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security validation passed')
      );
    });

    it('should detect suspicious user agents', () => {
      const warnSpy = jest.spyOn(middleware['logger'], 'warn');
      mockRequest.headers = {
        'user-agent': 'sqlmap/1.0',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious user agent')
      );
    });
  });

  describe('Valid Requests', () => {
    it('should allow clean, valid requests', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      }).not.toThrow();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should preserve valid data after sanitization', () => {
      const originalData = {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      mockRequest.body = { ...originalData };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.name).toBe(originalData.name);
      expect(mockRequest.body.email).toBe(originalData.email);
      expect(mockRequest.body.preferences.theme).toBe(originalData.preferences.theme);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});