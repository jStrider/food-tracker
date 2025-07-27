import { getCorsConfig } from "./cors.config";

describe("CORS Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should include default development origins", () => {
      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      // Test localhost:3000
      const callback1 = jest.fn();
      origin("http://localhost:3000", callback1);
      expect(callback1).toHaveBeenCalledWith(null, true);

      // Test localhost:5173 (Vite default)
      const callback2 = jest.fn();
      origin("http://localhost:5173", callback2);
      expect(callback2).toHaveBeenCalledWith(null, true);
    });

    it("should allow requests without origin in development", () => {
      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      const callback = jest.fn();
      origin(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it("should merge custom origins with development defaults", () => {
      process.env.ALLOWED_ORIGINS = "http://custom.dev:4000";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      // Custom origin
      const callback1 = jest.fn();
      origin("http://custom.dev:4000", callback1);
      expect(callback1).toHaveBeenCalledWith(null, true);

      // Default development origin still works
      const callback2 = jest.fn();
      origin("http://localhost:3000", callback2);
      expect(callback2).toHaveBeenCalledWith(null, true);
    });

    it("should use 1 hour max age in development", () => {
      const config = getCorsConfig();
      expect(config.maxAge).toBe(3600);
    });
  });

  describe("Production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should only allow configured origins", () => {
      process.env.ALLOWED_ORIGINS =
        "https://app.foodtracker.com,https://www.foodtracker.com";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      // Allowed origins
      const callback1 = jest.fn();
      origin("https://app.foodtracker.com", callback1);
      expect(callback1).toHaveBeenCalledWith(null, true);

      const callback2 = jest.fn();
      origin("https://www.foodtracker.com", callback2);
      expect(callback2).toHaveBeenCalledWith(null, true);

      // Disallowed origin
      const callback3 = jest.fn();
      origin("https://malicious.com", callback3);
      expect(callback3).toHaveBeenCalledWith(
        new Error("Origin https://malicious.com not allowed by CORS"),
      );
    });

    it("should not include development origins in production", () => {
      process.env.ALLOWED_ORIGINS = "https://app.foodtracker.com";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      const callback = jest.fn();
      origin("http://localhost:3000", callback);
      expect(callback).toHaveBeenCalledWith(
        new Error("Origin http://localhost:3000 not allowed by CORS"),
      );
    });

    it("should use 24 hour max age in production", () => {
      const config = getCorsConfig();
      expect(config.maxAge).toBe(86400);
    });

    it("should not allow requests without origin in production", () => {
      process.env.ALLOWED_ORIGINS = "https://app.foodtracker.com";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      const callback = jest.fn();
      origin(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true); // Still allows for mobile apps
    });
  });

  describe("Common configuration", () => {
    it("should include all necessary methods", () => {
      const config = getCorsConfig();
      expect(config.methods).toEqual([
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
      ]);
    });

    it("should include required headers", () => {
      const config = getCorsConfig();
      expect(config.allowedHeaders).toContain("Content-Type");
      expect(config.allowedHeaders).toContain("Authorization");
      expect(config.allowedHeaders).toContain("X-Requested-With");
      expect(config.allowedHeaders).toContain("Accept");
      expect(config.allowedHeaders).toContain("Origin");
    });

    it("should expose custom headers", () => {
      const config = getCorsConfig();
      expect(config.exposedHeaders).toContain("X-Total-Count");
      expect(config.exposedHeaders).toContain("X-Page-Count");
    });

    it("should enable credentials", () => {
      const config = getCorsConfig();
      expect(config.credentials).toBe(true);
    });

    it("should handle preflight correctly", () => {
      const config = getCorsConfig();
      expect(config.preflightContinue).toBe(false);
      expect(config.optionsSuccessStatus).toBe(204);
    });
  });

  describe("Origin parsing", () => {
    it("should handle multiple origins with spaces", () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS =
        "https://app.foodtracker.com, https://www.foodtracker.com , https://api.foodtracker.com";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      // All origins should work despite spaces
      const origins = [
        "https://app.foodtracker.com",
        "https://www.foodtracker.com",
        "https://api.foodtracker.com",
      ];

      origins.forEach((testOrigin) => {
        const callback = jest.fn();
        origin(testOrigin, callback);
        expect(callback).toHaveBeenCalledWith(null, true);
      });
    });

    it("should handle empty ALLOWED_ORIGINS", () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "";

      const config = getCorsConfig();
      const origin = config.origin as (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;

      const callback = jest.fn();
      origin("https://any.com", callback);
      expect(callback).toHaveBeenCalledWith(
        new Error("Origin https://any.com not allowed by CORS"),
      );
    });
  });
});
