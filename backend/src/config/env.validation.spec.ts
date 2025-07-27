import { validateEnvironment, validationSchema } from "./env.validation";

describe("Environment Validation", () => {
  describe("validationSchema", () => {
    it("should validate a complete valid configuration", () => {
      const _validConfig = {
        NODE_ENV: "development",
        PORT: "3001",
        DATABASE_PATH: "data/test.db",
        JWT_SECRET: "test-secret-key-with-32-characters",
        JWT_EXPIRES_IN: "24h",
        OPENFOODFACTS_API_URL: "https://world.openfoodfacts.org/api/v0",
        THROTTLE_TTL: "60000",
        THROTTLE_LIMIT: "100",
        LOG_LEVEL: "info",
        CORS_ORIGIN: "http://localhost:3000",
        HEALTH_CHECK_ENDPOINT: "/health",
      };

      const { error, value } = validationSchema.validate(validConfig);

      expect(error).toBeUndefined();
      expect(value).toBeDefined();
      expect(value.NODE_ENV).toBe("development");
      expect(value.PORT).toBe(3001);
    });

    it("should apply default values for missing optional fields", () => {
      const _minimalConfig = {
        JWT_SECRET: "test-secret-key-with-32-characters",
      };

      const { error, value } = validationSchema.validate(minimalConfig);

      expect(error).toBeUndefined();
      expect(value.NODE_ENV).toBe("development");
      expect(value.PORT).toBe(3001);
      expect(value.DATABASE_PATH).toBe("data/foodtracker.db");
      expect(value.JWT_EXPIRES_IN).toBe("24h");
    });

    it("should reject invalid NODE_ENV values", () => {
      const _invalidConfig = {
        NODE_ENV: "invalid",
        JWT_SECRET: "test-secret-key-with-32-characters",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("must be one of");
    });

    it("should reject JWT_SECRET that is too short", () => {
      const _invalidConfig = {
        JWT_SECRET: "short",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("at least 32 characters");
    });

    it("should reject invalid JWT_EXPIRES_IN format", () => {
      const _invalidConfig = {
        JWT_SECRET: "test-secret-key-with-32-characters",
        JWT_EXPIRES_IN: "invalid-format",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("fails to match");
    });

    it("should reject invalid PORT values", () => {
      const _invalidConfig = {
        PORT: "99999",
        JWT_SECRET: "test-secret-key-with-32-characters",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("valid port");
    });

    it("should reject invalid URL format for OPENFOODFACTS_API_URL", () => {
      const _invalidConfig = {
        JWT_SECRET: "test-secret-key-with-32-characters",
        OPENFOODFACTS_API_URL: "not-a-url",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("valid uri");
    });

    it("should reject negative THROTTLE_TTL", () => {
      const _invalidConfig = {
        JWT_SECRET: "test-secret-key-with-32-characters",
        THROTTLE_TTL: "-1000",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("positive number");
    });

    it("should reject invalid LOG_LEVEL values", () => {
      const _invalidConfig = {
        JWT_SECRET: "test-secret-key-with-32-characters",
        LOG_LEVEL: "invalid",
      };

      const { error } = validationSchema.validate(invalidConfig);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("must be one of");
    });
  });

  describe("validateEnvironment", () => {
    it("should return validated configuration for valid input", () => {
      const _validConfig = {
        NODE_ENV: "production",
        PORT: "8080",
        JWT_SECRET: "super-secure-secret-key-32-chars",
        DATABASE_PATH: "/app/data/production.db",
      };

      const _result = validateEnvironment(validConfig);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe("production");
      expect(result.PORT).toBe(8080);
      expect(result.JWT_SECRET).toBe("super-secure-secret-key-32-chars");
    });

    it("should throw error for invalid configuration", () => {
      const _invalidConfig = {
        NODE_ENV: "invalid",
        JWT_SECRET: "short",
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow(
        "Environment validation failed",
      );
    });

    it("should throw error with all validation messages", () => {
      const _invalidConfig = {
        NODE_ENV: "invalid",
        PORT: "not-a-number",
        JWT_SECRET: "short",
        THROTTLE_TTL: "-100",
      };

      expect(() => validateEnvironment(invalidConfig)).toThrow();

      try {
        validateEnvironment(invalidConfig);
      } catch (error) {
        expect(error.message).toContain("Environment validation failed");
        // Should contain multiple error messages
        expect(error.message.split(",").length).toBeGreaterThan(1);
      }
    });

    it("should allow unknown environment variables", () => {
      const _configWithUnknown = {
        JWT_SECRET: "test-secret-key-with-32-characters",
        UNKNOWN_VAR: "some-value",
        ANOTHER_UNKNOWN: "another-value",
      };

      expect(() => validateEnvironment(configWithUnknown)).not.toThrow();

      const _result = validateEnvironment(configWithUnknown);
      expect(result.JWT_SECRET).toBe("test-secret-key-with-32-characters");
    });
  });
});
