import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { TestAppModule } from "../../test/test-app.module";
import { TestAuthHelper } from "../../test/test-auth.helper";
import { User } from "../users/entities/user.entity";
import { Meal, MealCategory } from "../meals/entities/meal.entity";
import { Food, FoodSource } from "../foods/entities/food.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { fixtures } from "../../test/fixtures";

describe.skip("CalendarController Integration", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let testUser: User;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test user
    testUser = await TestAuthHelper.createTestUser(dataSource);
    authToken = TestAuthHelper.generateToken(testUser, jwtService);

    const _foodRepo = dataSource.getRepository(Food);
    const _apple = await foodRepo.save({
      ...fixtures.foods.apple,
      id: undefined,
      source: FoodSource.MANUAL,
    });
    const _chickenBreast = await foodRepo.save({
      ...fixtures.foods.chickenBreast,
      id: undefined,
      source: FoodSource.MANUAL,
    });

    // Create meals across different days
    const _mealRepo = dataSource.getRepository(Meal);
    const _foodEntryRepo = dataSource.getRepository(FoodEntry);

    // Day 1 - Two meals
    const breakfast1 = await mealRepo.save({
      name: "Breakfast Day 1",
      category: MealCategory.BREAKFAST,
      date: new Date("2024-01-15"),
      time: "08:00",
      userId: testUser.id,
    });
    const lunch1 = await mealRepo.save({
      name: "Lunch Day 1",
      category: MealCategory.LUNCH,
      date: new Date("2024-01-15"),
      time: "12:30",
      userId: testUser.id,
    });

    // Day 2 - One meal
    const dinner2 = await mealRepo.save({
      name: "Dinner Day 2",
      category: MealCategory.DINNER,
      date: new Date("2024-01-16"),
      time: "19:00",
      userId: testUser.id,
    });

    // Add food entries
    await foodEntryRepo.save([
      {
        mealId: breakfast1.id,
        foodId: apple.id,
        quantity: 2,
        unit: "servings",
        calculatedCalories: 104,
        calculatedProtein: 0.6,
        calculatedCarbs: 28,
        calculatedFat: 0.4,
      },
      {
        mealId: lunch1.id,
        foodId: chickenBreast.id,
        quantity: 200,
        unit: "g",
        calculatedCalories: 330,
        calculatedProtein: 62,
        calculatedCarbs: 0,
        calculatedFat: 7.2,
      },
      {
        mealId: dinner2.id,
        foodId: chickenBreast.id,
        quantity: 150,
        unit: "g",
        calculatedCalories: 247.5,
        calculatedProtein: 46.5,
        calculatedCarbs: 0,
        calculatedFat: 5.4,
      },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /calendar/month", () => {
    it("should return month view with nutrition data", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/month?month=1&year=2024")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        month: 1,
        year: 2024,
        days: expect.any(Array),
        summary: {
          totalDays: 31,
          daysWithData: expect.any(Number),
          averageCalories: expect.any(Number),
          totalCalories: expect.any(Number),
        },
      });

      expect(response.body.days).toHaveLength(31);

      // Check specific day with data
      const day15 = response.body.days.find((day) => day.date === "2024-01-15");
      expect(day15).toBeDefined();
      expect(day15.mealCount).toBe(2);
      expect(day15.totalCalories).toBe(434);
      expect(day15.hasData).toBe(true);
    });

    it("should handle empty month", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/month?month=2&year=2024")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.summary.daysWithData).toBe(0);
      expect(response.body.summary.totalCalories).toBe(0);
      expect(response.body.summary.averageCalories).toBe(0);
    });
  });

  describe("POST /calendar/month/with-goals", () => {
    it("should return month view with goal progress", async () => {
      const _goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const _response = await request(app.getHttpServer())
        .post("/calendar/month/with-goals?month=1&year=2024")
        .send(goals)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(201);

      expect(response.body.month).toBe(1);
      expect(response.body.year).toBe(2024);

      // Check day with goal progress
      const day15 = response.body.days.find((day) => day.date === "2024-01-15");
      expect(day15.goalProgress).toBeDefined();
      expect(day15.goalProgress.calories).toBe(22); // 434/2000 * 100
    });
  });

  describe("GET /calendar/week", () => {
    it("should return week view with nutrition data", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/week?startDate=2024-01-15")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        startDate: "2024-01-14", // Start of week
        endDate: "2024-01-20", // End of week
        days: expect.any(Array),
        summary: {
          totalCalories: expect.any(Number),
          averageCalories: expect.any(Number),
          daysWithData: expect.any(Number),
        },
      });

      // Should have data for at least 2 days
      const _daysWithData = response.body.days.filter((day) => day.hasData);
      expect(daysWithData.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("POST /calendar/week/with-goals", () => {
    it("should return week view with goal progress", async () => {
      const _goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
      };

      const _response = await request(app.getHttpServer())
        .post("/calendar/week/with-goals?startDate=2024-01-15")
        .send(goals)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(201);

      const _daysWithData = response.body.days.filter((day) => day.hasData);
      daysWithData.forEach((day) => {
        expect(day.goalProgress).toBeDefined();
        expect(day.goalProgress.calories).toBeGreaterThan(0);
      });
    });
  });

  describe("GET /calendar/day", () => {
    it("should return detailed day view", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/day?date=2024-01-15")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        date: "2024-01-15",
        mealCount: 2,
        calories: 434,
        protein: expect.closeTo(62.6, 1),
        carbs: 28,
        fat: expect.closeTo(7.6, 1),
      });

      expect(response.body.meals).toHaveLength(2);
      expect(response.body.meals[0]).toHaveProperty("name");
      expect(response.body.meals[0]).toHaveProperty("category");
    });

    it("should return empty day data", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/day?date=2024-01-20")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.mealCount).toBe(0);
      expect(response.body.calories).toBe(0);
    });
  });

  describe("GET /calendar/streaks", () => {
    beforeEach(async () => {
      // Add more consecutive days for streak testing
      const _userRepo = dataSource.getRepository(User);
      const _user = await userRepo.findOne({
        where: { email: "test@example.com" },
      });
      const _mealRepo = dataSource.getRepository(Meal);
      const _foodEntryRepo = dataSource.getRepository(FoodEntry);
      const _foodRepo = dataSource.getRepository(Food);
      const _apple = await foodRepo.findOne({ where: { name: "Apple" } });

      // Create 5 consecutive days
      for (let _i = 17; i <= 21; i++) {
        const _meal = await mealRepo.save({
          name: `Streak Day ${i}`,
          category: MealCategory.BREAKFAST,
          date: new Date(`2024-01-${i}`),
          time: "08:00",
          userId: testUser.id,
        });

        await foodEntryRepo.save({
          mealId: meal.id,
          foodId: apple.id,
          quantity: 1,
          unit: "serving",
          calculatedCalories: 52,
          calculatedProtein: 0.3,
          calculatedCarbs: 14,
          calculatedFat: 0.2,
        });
      }
    });

    it("should calculate nutrition streaks", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/streaks?endDate=2024-01-21")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        currentStreak: 5, // 5 consecutive days ending on Jan 21
        longestStreak: expect.any(Number),
        streakDates: expect.any(Array),
      });

      expect(response.body.streakDates).toHaveLength(5);
      expect(response.body.streakDates[0]).toBe("2024-01-17");
      expect(response.body.streakDates[4]).toBe("2024-01-21");
    });

    it("should handle no streaks", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/streaks?endDate=2023-12-31")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.currentStreak).toBe(0);
      expect(response.body.streakDates).toHaveLength(0);
    });
  });

  describe("GET /calendar/stats", () => {
    it("should return calendar statistics", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/stats?startDate=2024-01-01&endDate=2024-01-31")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        totalDays: 31,
        daysWithData: expect.any(Number),
        completionRate: expect.any(Number),
        averageCalories: expect.any(Number),
        averageMealsPerDay: expect.any(Number),
        mostActiveDay: expect.any(String),
        leastActiveDay: expect.any(String),
      });

      expect(response.body.daysWithData).toBeGreaterThan(0);
      expect(response.body.completionRate).toBeGreaterThan(0);
    });

    it("should handle empty date range", async () => {
      const _response = await request(app.getHttpServer())
        .get("/calendar/stats?startDate=2023-01-01&endDate=2023-01-31")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.daysWithData).toBe(0);
      expect(response.body.completionRate).toBe(0);
      expect(response.body.averageCalories).toBe(0);
      expect(response.body.averageMealsPerDay).toBe(0);
    });
  });
});
