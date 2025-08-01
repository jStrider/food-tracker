import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { of } from "rxjs";
import { RateLimitHeadersInterceptor } from "./rate-limit-headers.interceptor";
import { RATE_LIMIT_CATEGORIES } from "../../config/rate-limit.config";

describe("RateLimitHeadersInterceptor", () => {
  let interceptor: RateLimitHeadersInterceptor;
  let reflector: Reflector;

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitHeadersInterceptor,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<RateLimitHeadersInterceptor>(RateLimitHeadersInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockExecutionContext = (category?: string): ExecutionContext => {
    const mockRequest = {
      method: "GET",
      url: "/test",
    };

    const mockResponse = {
      setHeader: jest.fn(),
    };

    const mockHandler = {};

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => mockHandler,
    } as ExecutionContext;
  };

  const createMockCallHandler = (data: any = { message: "success" }): CallHandler => {
    return {
      handle: () => of(data),
    };
  };

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should add rate limit headers with default category", (done) => {
    mockReflector.get.mockReturnValue(undefined); // No specific category set
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ message: "success" });
        
        // Verify headers were set with default values
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", expect.any(Number));
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", expect.any(Number));
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(String));
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Category", RATE_LIMIT_CATEGORIES.DEFAULT);
        
        done();
      },
      error: done,
    });
  });

  it("should use AUTH category when specified", (done) => {
    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.AUTH);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 5); // AUTH limit
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 4); // limit - 1
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Category", RATE_LIMIT_CATEGORIES.AUTH);
        
        done();
      },
      error: done,
    });
  });

  it("should use QUERY category when specified", (done) => {
    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.QUERY);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        const expectedLimit = process.env.NODE_ENV === "production" ? 100 : 200;
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", expectedLimit);
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", expectedLimit - 1);
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Category", RATE_LIMIT_CATEGORIES.QUERY);
        
        done();
      },
      error: done,
    });
  });

  it("should use EXPENSIVE category when specified", (done) => {
    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.EXPENSIVE);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10); // EXPENSIVE limit
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 9); // limit - 1
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Category", RATE_LIMIT_CATEGORIES.EXPENSIVE);
        
        done();
      },
      error: done,
    });
  });

  it("should set reset time in ISO format", (done) => {
    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.DEFAULT);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        const resetHeaderCall = mockResponse.setHeader.mock.calls.find(
          call => call[0] === "X-RateLimit-Reset"
        );
        
        expect(resetHeaderCall).toBeDefined();
        const resetTime = resetHeaderCall[1];
        expect(typeof resetTime).toBe("string");
        expect(() => new Date(resetTime)).not.toThrow();
        
        done();
      },
      error: done,
    });
  });

  it("should calculate remaining as limit - 1", (done) => {
    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.AUTH);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 5);
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 4);
        
        done();
      },
      error: done,
    });
  });

  it("should handle production vs development limits", (done) => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    mockReflector.get.mockReturnValue(RATE_LIMIT_CATEGORIES.DEFAULT);
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 60); // production limit
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 59);
        
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
        done();
      },
      error: done,
    });
  });

  it("should use default category for unknown categories", (done) => {
    mockReflector.get.mockReturnValue("unknown-category");
    
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();
    const mockResponse = mockContext.switchToHttp().getResponse();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        const expectedLimit = process.env.NODE_ENV === "production" ? 60 : 120;
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", expectedLimit);
        expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Category", "unknown-category");
        
        done();
      },
      error: done,
    });
  });
});