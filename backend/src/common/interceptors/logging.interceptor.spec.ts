import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  const createMockExecutionContext = (
    method: string = "GET",
    url: string = "/test",
    userAgent: string = "test-agent",
  ): ExecutionContext => {
    const mockRequest = {
      method,
      url,
      headers: {
        "user-agent": userAgent,
      },
      get: jest.fn((header: string) => {
        if (header === "User-Agent") return userAgent;
        return mockRequest.headers[header.toLowerCase()];
      }),
      user: { id: "test-user" },
    };

    const mockResponse = {
      statusCode: 200,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (
    data: any = { message: "success" },
    shouldThrow: boolean = false,
  ): CallHandler => {
    return {
      handle: () => (shouldThrow ? throwError(new Error("Test error")) : of(data)),
    };
  };

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should log request and response for successful requests", (done) => {
    const mockContext = createMockExecutionContext("GET", "/api/test");
    const mockCallHandler = createMockCallHandler();

    // Mock console.log to capture logs
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ message: "success" });
        done();
      },
      error: done,
    });

    // Verify logs were called (timing may vary, so we check after a short delay)
    setTimeout(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("GET /api/test"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Response:"),
      );
      consoleSpy.mockRestore();
    }, 10);
  });

  it("should log request and error for failed requests", (done) => {
    const mockContext = createMockExecutionContext("POST", "/api/error");
    const mockCallHandler = createMockCallHandler(null, true);

    // Mock console.log and console.error
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        done(new Error("Should not reach success handler"));
      },
      error: (error) => {
        expect(error.message).toBe("Test error");
        
        // Verify logs were called
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("POST /api/error"),
          );
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error in POST /api/error:",
            expect.any(Error),
          );
          consoleSpy.mockRestore();
          consoleErrorSpy.mockRestore();
          done();
        }, 10);
      },
    });
  });

  it("should handle different HTTP methods", (done) => {
    const mockContext = createMockExecutionContext("PUT", "/api/update");
    const mockCallHandler = createMockCallHandler();

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("PUT /api/update"),
          );
          consoleSpy.mockRestore();
          done();
        }, 10);
      },
      error: done,
    });
  });

  it("should include user-agent in logs", (done) => {
    const mockContext = createMockExecutionContext(
      "GET", 
      "/api/test", 
      "Mozilla/5.0 Test Browser"
    );
    const mockCallHandler = createMockCallHandler();

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("Mozilla/5.0 Test Browser"),
          );
          consoleSpy.mockRestore();
          done();
        }, 10);
      },
      error: done,
    });
  });

  it("should measure execution time", (done) => {
    const mockContext = createMockExecutionContext();
    const mockCallHandler = createMockCallHandler();

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringMatching(/Response:.*\d+ms/),
          );
          consoleSpy.mockRestore();
          done();
        }, 10);
      },
      error: done,
    });
  });
});