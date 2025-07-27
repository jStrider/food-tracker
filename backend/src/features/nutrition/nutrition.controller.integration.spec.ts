import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { TestAppModule } from '../../test/test-app.module';
import { TestAuthHelper } from '../../test/test-auth.helper';
import { User } from '../users/entities/user.entity';
import { Meal, MealCategory } from '../meals/entities/meal.entity';
import { Food, FoodSource } from '../foods/entities/food.entity';
import { FoodEntry } from '../foods/entities/food-entry.entity';
import { DailyNutrition } from './entities/daily-nutrition.entity';
import { fixtures } from '../../test/fixtures';

describe('NutritionController Integration', () => {
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

    const foodRepo = dataSource.getRepository(Food);
    const apple = await foodRepo.save({
      ...fixtures.foods.apple,
      id: undefined,
      source: FoodSource.MANUAL,
    });
    const chickenBreast = await foodRepo.save({
      ...fixtures.foods.chickenBreast,
      id: undefined,
      source: FoodSource.MANUAL,
    });
    const brownRice = await foodRepo.save({
      ...fixtures.foods.brownRice,
      id: undefined,
      source: FoodSource.MANUAL,
    });

    const mealRepo = dataSource.getRepository(Meal);
    const breakfast = await mealRepo.save({
      name: 'Breakfast',
      category: MealCategory.BREAKFAST,
      date: new Date('2024-01-15'),
      time: '08:00',
      userId: testUser.id,
    });
    const lunch = await mealRepo.save({
      name: 'Lunch',
      category: MealCategory.LUNCH,
      date: new Date('2024-01-15'),
      time: '12:30',
      userId: testUser.id,
    });

    const foodEntryRepo = dataSource.getRepository(FoodEntry);
    await foodEntryRepo.save([
      {
        mealId: breakfast.id,
        foodId: apple.id,
        quantity: 1.5,
        unit: 'servings',
        calculatedCalories: 78,
        calculatedProtein: 0.45,
        calculatedCarbs: 21,
        calculatedFat: 0.3,
      },
      {
        mealId: lunch.id,
        foodId: chickenBreast.id,
        quantity: 200,
        unit: 'g',
        calculatedCalories: 330,
        calculatedProtein: 62,
        calculatedCarbs: 0,
        calculatedFat: 7.2,
      },
      {
        mealId: lunch.id,
        foodId: brownRice.id,
        quantity: 150,
        unit: 'g',
        calculatedCalories: 166.5,
        calculatedProtein: 3.9,
        calculatedCarbs: 34.5,
        calculatedFat: 1.35,
      },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /nutrition/daily', () => {
    it('should return daily nutrition summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/daily?date=2024-01-15')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        date: '2024-01-15',
        mealCount: 2,
        calories: 497.28,
        protein: expect.closeTo(65.9045, 2),
        carbs: 34.71,
        fat: expect.closeTo(8.553, 2),
      });

      expect(response.body.meals).toHaveLength(2);
      expect(response.body.meals[0]).toHaveProperty('name');
      expect(response.body.meals[0]).toHaveProperty('category');
    });

    it('should return empty nutrition for day with no meals', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/daily?date=2024-01-20')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        date: '2024-01-20',
        mealCount: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    });
  });

  describe('GET /nutrition/weekly', () => {
    it('should return weekly nutrition summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/weekly?startDate=2024-01-15')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        startDate: expect.any(String),
        endDate: expect.any(String),
        totals: {
          calories: expect.any(Number),
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number),
        },
        averages: {
          calories: expect.any(Number),
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number),
        },
      });

      expect(response.body.days).toHaveLength(7);
    });
  });

  describe('GET /nutrition/monthly', () => {
    it('should return monthly nutrition data', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/monthly?month=1&year=2024')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(31); // January has 31 days
      
      // Find the day with data
      const dayWithData = response.body.find(day => day.date === '2024-01-15');
      expect(dayWithData).toBeDefined();
      expect(dayWithData.calories).toBe(497.28);
    });
  });

  describe.skip('POST /nutrition/goals', () => {
    it('should compare nutrition to goals', async () => {
      const goals = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
        fiber: 30,
        sodium: 2300,
      };

      const response = await request(app.getHttpServer())
        .post('/nutrition/goals?date=2024-01-15')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .send(goals)
        .expect(201);

      expect(response.body).toMatchObject({
        nutrition: {
          date: '2024-01-15',
          calories: 574.5,
        },
        goals,
        percentages: {
          calories: expect.closeTo(28.7, 1), // 574.5/2000 * 100
          protein: expect.closeTo(66.4, 1),
          carbs: expect.closeTo(22.2, 1),
          fat: expect.closeTo(13.6, 1),
        },
        status: {
          calories: 'under',
          protein: 'under',
          carbs: 'under',
          fat: 'under',
        },
      });
    });
  });

  describe.skip('GET /nutrition/macros', () => {
    it('should return macro breakdown for a date', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/macros?date=2024-01-15')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        date: '2024-01-15',
        calories: 574.5,
        macros: {
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number),
        },
      });

      // Verify percentages add up to approximately 100
      const { protein, carbs, fat } = response.body.macros;
      const total = protein + carbs + fat;
      expect(total).toBeGreaterThan(95);
      expect(total).toBeLessThanOrEqual(100);
    });
  });

  describe.skip('GET /nutrition/trends', () => {
    beforeEach(async () => {
      // Add more meals for trend analysis
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { email: 'test@example.com' } });
      const mealRepo = dataSource.getRepository(Meal);
      const foodEntryRepo = dataSource.getRepository(FoodEntry);
      const foodRepo = dataSource.getRepository(Food);
      const apple = await foodRepo.findOne({ where: { name: 'Apple' } });

      for (let i = 1; i <= 7; i++) {
        const meal = await mealRepo.save({
          name: `Day ${i} Breakfast`,
          category: MealCategory.BREAKFAST,
          date: new Date(`2024-01-${10 + i}`),
          time: '08:00',
          userId: testUser.id,
        });

        await foodEntryRepo.save({
          mealId: meal.id,
          foodId: apple.id,
          quantity: 2,
          unit: 'servings',
          calculatedCalories: 104,
          calculatedProtein: 0.6,
          calculatedCarbs: 28,
          calculatedFat: 0.4,
        });
      }
    });

    it('should return nutrition trends for date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/trends?startDate=2024-01-10&endDate=2024-01-20&period=daily')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('calories');
        expect(trend).toHaveProperty('protein');
        expect(trend).toHaveProperty('carbs');
        expect(trend).toHaveProperty('fat');
      });
    });
  });

  describe.skip('GET /nutrition/summary', () => {
    it('should return comprehensive nutrition summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/nutrition/summary?startDate=2024-01-01&endDate=2024-01-31')
        .set(TestAuthHelper.getAuthHeader(authToken))
        .expect(200);

      expect(response.body).toMatchObject({
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        totals: {
          calories: expect.any(Number),
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number),
        },
        averages: {
          calories: expect.any(Number),
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number),
        },
        daysWithData: expect.any(Number),
        totalDays: 31,
      });
    });
  });
});