import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { TestAppModule } from "../../test/test-app.module";
import { DataSource } from "typeorm";
import { User } from "../users/entities/user.entity";
import * as bcrypt from "bcrypt";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database - delete all users
    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();
    if (users.length > 0) {
      await userRepository.remove(users);
    }
  });

  describe("/auth/register (POST)", () => {
    it("should register a new user successfully", async () => {
      const registerDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
        timezone: "Europe/Paris",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body.user).toMatchObject({
        email: registerDto.email,
        name: registerDto.name,
        timezone: registerDto.timezone,
      });
      expect(response.body.user).not.toHaveProperty("password");

      // Verify user was created in database
      const user = await dataSource.getRepository(User).findOne({
        where: { email: registerDto.email },
        select: ["id", "email", "name", "password"],
      });
      expect(user).toBeDefined();
      expect(await bcrypt.compare(registerDto.password, user!.password!)).toBe(
        true,
      );
    });

    it("should fail when email already exists", async () => {
      const existingUser = {
        email: "existing@example.com",
        name: "Existing User",
        password: await bcrypt.hash("password123", 10),
      };

      await dataSource.getRepository(User).save(existingUser);

      const registerDto = {
        email: existingUser.email,
        name: "Another User",
        password: "newpassword123",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain("already exists");
    });

    it("should fail with invalid email format", async () => {
      const registerDto = {
        email: "invalid-email",
        name: "Test User",
        password: "password123",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message[0]).toContain("email");
    });

    it("should fail with short password", async () => {
      const registerDto = {
        email: "test@example.com",
        name: "Test User",
        password: "short",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message[0]).toContain("password");
    });

    it("should fail with missing required fields", async () => {
      const registerDto = {
        email: "test@example.com",
        // missing name and password
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain("name");
      expect(response.body.message).toContain("password");
    });

    it("should register without timezone (optional field)", async () => {
      const registerDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123",
        // no timezone provided
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body.user.email).toBe(registerDto.email);
    });
  });

  describe("/auth/login (POST)", () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash("password123", 10);
      await dataSource.getRepository(User).save({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        timezone: "UTC",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginDto = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body.user).toMatchObject({
        email: loginDto.email,
        name: "Test User",
      });
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should fail with invalid password", async () => {
      const loginDto = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);
    });

    it("should fail with non-existent email", async () => {
      const loginDto = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);
    });
  });

  describe("/auth/me (GET)", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create and login a test user
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await dataSource.getRepository(User).save({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        timezone: "UTC",
      });
      userId = user.id;

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      authToken = loginResponse.body.access_token;
    });

    it("should return user profile when authenticated", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        email: "test@example.com",
        name: "Test User",
      });
      expect(response.body).not.toHaveProperty("password");
    });

    it("should fail without authentication token", async () => {
      await request(app.getHttpServer()).get("/auth/me").expect(401);
    });

    it("should fail with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("/auth/refresh (POST)", () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create and login a test user to get refresh token
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await dataSource.getRepository(User).save({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        timezone: "UTC",
      });
      userId = user.id;

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      refreshToken = loginResponse.body.refresh_token;
    });

    it("should refresh tokens successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body.refresh_token).not.toBe(refreshToken); // Token rotation
      expect(response.body.user).toMatchObject({
        id: userId,
        email: "test@example.com",
        name: "Test User",
      });
    });

    it("should fail with invalid refresh token", async () => {
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: "invalid-refresh-token",
        })
        .expect(403);
    });

    it("should fail with missing refresh token", async () => {
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({})
        .expect(400);
    });

    it("should fail with previously used refresh token after rotation", async () => {
      // First refresh
      const firstRefresh = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: refreshToken,
        });

      // Try to use the old refresh token again
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: refreshToken,
        })
        .expect(403);

      // New token should still work
      const secondRefresh = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: firstRefresh.body.refresh_token,
        })
        .expect(200);

      expect(secondRefresh.body).toHaveProperty("access_token");
      expect(secondRefresh.body).toHaveProperty("refresh_token");
    });
  });

  describe("/auth/logout (POST)", () => {
    let authToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create and login a test user
      const hashedPassword = await bcrypt.hash("password123", 10);
      await dataSource.getRepository(User).save({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        timezone: "UTC",
      });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      authToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it("should logout successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: "Logout successful" });

      // Refresh token should no longer work
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({
          refresh_token: refreshToken,
        })
        .expect(403);
    });

    it("should fail without authentication", async () => {
      await request(app.getHttpServer()).post("/auth/logout").expect(401);
    });

    it("should fail with invalid token", async () => {
      await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });
});
