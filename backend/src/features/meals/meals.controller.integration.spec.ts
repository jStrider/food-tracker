import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { TestAppModule } from "../../test/test-app.module";
import { TestAuthHelper } from "../../test/test-auth.helper";
import { User } from "../users/entities/user.entity";
import { Meal, MealCategory } from "./entities/meal.entity";
import { Food, FoodSource } from "../foods/entities/food.entity";
import { FoodEntry } from "../foods/entities/food-entry.entity";
import { fixtures } from "../../test/fixtures";

describe("MealsController Integration", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let testUser: User;
  let authToken: string;
  let chickenBreastFood: Food;
  let appleFood: Food;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Seed test data
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

    // Store IDs for later use
    chickenBreastFood = chickenBreast;
    appleFood = apple;
    fixtures.foods.apple.id = apple.id;
    fixtures.foods.chickenBreast.id = chickenBreast.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /meals", () => {
    it("should create a new meal", async () => {
      const _createMealDto = {
        name: "Test Breakfast",
        category: MealCategory.BREAKFAST,
        date: "2024-01-15",
        time: "08:00",
        notes: "Integration test meal",
      };

      const _response = await request(app.getHttpServer())
        .post("/meals")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(createMealDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: createMealDto.name,
        category: createMealDto.category,
        date: createMealDto.date,
        time: createMealDto.time,
        notes: createMealDto.notes,
      });
    });

    it("should auto-categorize meal when category not provided", async () => {
      const _createMealDto = {
        name: "Auto-categorized Lunch",
        date: "2024-01-15",
        time: "13:00",
      };

      const _response = await request(app.getHttpServer())
        .post("/meals")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(createMealDto)
        .expect(201);

      expect(response.body.category).toBe("lunch");
    });

    it("should validate required fields", async () => {
      const _createMealDto = {
        category: MealCategory.BREAKFAST,
        // Missing required date
      };

      await request(app.getHttpServer())
        .post("/meals")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(createMealDto)
        .expect(400);
    });
  });

  describe("GET /meals", () => {
    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);

      // Create multiple meals
      await mealRepo.save({
        name: "Breakfast",
        category: MealCategory.BREAKFAST,
        date: new Date("2024-01-15"),
        time: "08:00",
        userId: testUser.id,
      });
      await mealRepo.save({
        name: "Lunch",
        category: MealCategory.LUNCH,
        date: new Date("2024-01-15"),
        time: "12:30",
        userId: testUser.id,
      });
      await mealRepo.save({
        name: "Dinner",
        category: MealCategory.DINNER,
        date: new Date("2024-01-16"),
        time: "19:00",
        userId: testUser.id,
      });
    });

    it("should return all meals", async () => {
      const _response = await request(app.getHttpServer())
        .get("/meals")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("category");
    });

    it("should filter meals by date", async () => {
      const _response = await request(app.getHttpServer())
        .get("/meals?date=2024-01-15")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(
        response.body.data.every((meal) => meal.date === "2024-01-15"),
      ).toBe(true);
    });

    it("should filter meals by category", async () => {
      const _response = await request(app.getHttpServer())
        .get("/meals?category=breakfast")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].category).toBe("breakfast");
    });
  });

  describe("GET /meals/:id", () => {
    let mealId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _meal = await mealRepo.save({
        name: "Test Meal",
        category: MealCategory.LUNCH,
        date: new Date("2024-01-15"),
        time: "12:30",
        userId: testUser.id,
      });
      mealId = meal.id;
    });

    it("should return a specific meal with foods", async () => {
      const _response = await request(app.getHttpServer())
        .get(`/meals/${mealId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        id: mealId,
        name: "Test Meal",
        category: MealCategory.LUNCH,
        foods: expect.any(Array),
      });
    });

    it("should return 404 for non-existent meal", async () => {
      await request(app.getHttpServer())
        .get("/meals/00000000-0000-0000-0000-000000000000")
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(404);
    });
  });

  describe("PUT /meals/:id", () => {
    let mealId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _meal = await mealRepo.save({
        name: "Original Meal",
        category: MealCategory.LUNCH,
        date: new Date("2024-01-15"),
        time: "12:30",
        userId: testUser.id,
      });
      mealId = meal.id;
    });

    it("should update a meal", async () => {
      const _updateMealDto = {
        name: "Updated Meal",
        notes: "Updated notes",
      };

      const _response = await request(app.getHttpServer())
        .put(`/meals/${mealId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(updateMealDto)
        .expect(200);

      expect(response.body.name).toBe("Updated Meal");
      expect(response.body.notes).toBe("Updated notes");
      expect(response.body.category).toBe("lunch"); // Unchanged
    });
  });

  describe("DELETE /meals/:id", () => {
    let mealId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _meal = await mealRepo.save({
        name: "Meal to Delete",
        category: MealCategory.DINNER,
        date: new Date("2024-01-15"),
        time: "19:00",
        userId: testUser.id,
      });
      mealId = meal.id;
    });

    it("should delete a meal", async () => {
      await request(app.getHttpServer())
        .delete(`/meals/${mealId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/meals/${mealId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(404);
    });
  });

  describe.skip("POST /meals/:id/foods", () => {
    let mealId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _meal = await mealRepo.save({
        name: "Meal for Foods",
        category: MealCategory.BREAKFAST,
        date: new Date("2024-01-15"),
        time: "08:00",
        userId: testUser.id,
      });
      mealId = meal.id;
    });

    it("should add food to meal", async () => {
      const _addFoodDto = {
        foodId: appleFood.id,
        quantity: 2,
        unit: "servings",
      };

      const _response = await request(app.getHttpServer())
        .post(`/meals/${mealId}/foods`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(addFoodDto)
        .expect(201);

      expect(response.body).toMatchObject({
        foodId: appleFood.id,
        quantity: 2,
        unit: "servings",
        calculatedCalories: expect.any(Number),
        calculatedProtein: expect.any(Number),
      });
    });

    it("should validate food existence", async () => {
      const _addFoodDto = {
        foodId: "00000000-0000-0000-0000-000000000000",
        quantity: 1,
        unit: "g",
      };

      await request(app.getHttpServer())
        .post(`/meals/${mealId}/foods`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(addFoodDto)
        .expect(404);
    });
  });

  describe.skip("PUT /meals/:mealId/foods/:entryId", () => {
    let mealId: string;
    let entryId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _foodEntryRepo = dataSource.getRepository(FoodEntry);

      const _meal = await mealRepo.save({
        name: "Meal with Food",
        category: MealCategory.LUNCH,
        date: new Date("2024-01-15"),
        time: "12:30",
        userId: testUser.id,
      });
      mealId = meal.id;

      const _foodEntry = await foodEntryRepo.save({
        mealId: meal.id,
        foodId: chickenBreastFood.id,
        quantity: 100,
        unit: "g",
        calculatedCalories: 165,
        calculatedProtein: 31,
        calculatedCarbs: 0,
        calculatedFat: 3.6,
      });
      entryId = foodEntry.id;
    });

    it("should update food quantity", async () => {
      const _updateDto = {
        quantity: 200,
      };

      const _response = await request(app.getHttpServer())
        .put(`/meals/${mealId}/foods/${entryId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(updateDto)
        .expect(200);

      expect(response.body.quantity).toBe(200);
      expect(response.body.calculatedCalories).toBe(330); // Doubled
    });
  });

  describe.skip("DELETE /meals/:mealId/foods/:entryId", () => {
    let mealId: string;
    let entryId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _foodEntryRepo = dataSource.getRepository(FoodEntry);

      const _meal = await mealRepo.save({
        name: "Meal with Food to Delete",
        category: MealCategory.DINNER,
        date: new Date("2024-01-15"),
        time: "19:00",
        userId: testUser.id,
      });
      mealId = meal.id;

      const _foodEntry = await foodEntryRepo.save({
        mealId: meal.id,
        foodId: appleFood.id,
        quantity: 1,
        unit: "serving",
        calculatedCalories: 52,
        calculatedProtein: 0.3,
        calculatedCarbs: 14,
        calculatedFat: 0.2,
      });
      entryId = foodEntry.id;
    });

    it("should remove food from meal", async () => {
      await request(app.getHttpServer())
        .delete(`/meals/${mealId}/foods/${entryId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(204);

      // Verify the meal still exists but food is removed
      const _response = await request(app.getHttpServer())
        .get(`/meals/${mealId}`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body.foods).toHaveLength(0);
    });
  });

  describe.skip("GET /meals/:id/nutrition", () => {
    let mealId: string;

    beforeEach(async () => {
      const _mealRepo = dataSource.getRepository(Meal);
      const _foodEntryRepo = dataSource.getRepository(FoodEntry);

      const _meal = await mealRepo.save({
        name: "Nutritious Meal",
        category: MealCategory.LUNCH,
        date: new Date("2024-01-15"),
        time: "12:30",
        userId: testUser.id,
      });
      mealId = meal.id;

      await foodEntryRepo.save({
        mealId: meal.id,
        foodId: chickenBreastFood.id,
        quantity: 200,
        unit: "g",
        calculatedCalories: 330,
        calculatedProtein: 62,
        calculatedCarbs: 0,
        calculatedFat: 7.2,
      });
      await foodEntryRepo.save({
        mealId: meal.id,
        foodId: appleFood.id,
        quantity: 1,
        unit: "serving",
        calculatedCalories: 52,
        calculatedProtein: 0.3,
        calculatedCarbs: 14,
        calculatedFat: 0.2,
      });
    });

    it("should return meal nutrition summary", async () => {
      const _response = await request(app.getHttpServer())
        .get(`/meals/${mealId}/nutrition`)
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        id: mealId,
        name: "Nutritious Meal",
        category: MealCategory.LUNCH,
        foodCount: 2,
        calories: 382,
        protein: 62.3,
        carbs: 14,
        fat: 7.4,
      });
    });
  });
});
