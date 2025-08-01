import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set context', () => {
    service.setContext('TestContext');
    // Context is private, but we can test that it doesn't throw
    expect(() => service.setContext('TestContext')).not.toThrow();
  });

  it('should log error with context', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    service.setContext('TestService');
    service.error('Test error message', { 
      userId: 'test-user',
      operation: 'test-operation' 
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log request', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    service.logRequest('GET', '/api/test', 'user-123', {
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log response with appropriate level', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Success response
    service.logResponse('GET', '/api/test', 200, 150, 'user-123');
    
    // Error response
    service.logResponse('GET', '/api/test', 500, 1500, 'user-123');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log performance with appropriate level', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Fast operation
    service.logPerformance('Fast operation', 100);
    
    // Slow operation
    service.logPerformance('Slow operation', 2000);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log security events', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    service.logSecurityEvent('Failed login attempt', {
      userId: 'test-user',
      ip: '192.168.1.1'
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log database operations', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    service.logDatabaseOperation('SELECT', 'users', {
      query: 'SELECT * FROM users WHERE id = ?',
      parameters: [123]
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});