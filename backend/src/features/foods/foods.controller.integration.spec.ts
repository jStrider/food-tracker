import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { FoodsModule } from './foods.module';
import { User } from '../users/entities/user.entity';
import { Food, FoodSource } from './entities/food.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FoodsService } from './foods.service';
import { fixtures } from '../../test/fixtures';

// Mock OpenFoodFactsService
jest.mock('../../integrations/openfoodfacts/openfoodfacts.service');

describe('FoodsController Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let foodsService: FoodsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Food],
          synchronize: true,
          logging: false,
        }),
        FoodsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    foodsService = moduleFixture.get<FoodsService>(FoodsService);

    // Seed test data
    const foodRepo = dataSource.getRepository(Food);
    await foodRepo.save([
      { ...fixtures.foods.apple, id: undefined, source: FoodSource.MANUAL },
      { ...fixtures.foods.chickenBreast, id: undefined, source: FoodSource.MANUAL },
      { ...fixtures.foods.brownRice, id: undefined, source: FoodSource.MANUAL },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /foods/search', () => {
    it('should search foods by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/foods/search?query=apple')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Apple');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/foods/search?query=pizza')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should search by barcode', async () => {
      const response = await request(app.getHttpServer())
        .get('/foods/search?barcode=1111111111')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].barcode).toBe('1111111111');
    });

    it('should use OpenFoodFacts when includeExternal=true', async () => {
      // Mock the OpenFoodFacts response
      jest.spyOn(foodsService, 'searchByName').mockResolvedValueOnce([
        {
          id: '0',
          name: 'External Apple',
          barcode: '9999999999',
          source: 'openfoodfacts' as any,
          brand: 'Test Brand',
          calories: 50,
          protein: 0.3,
          carbs: 13,
          fat: 0.2,
          fiber: 2,
          sugar: 10,
          sodium: 1,
          servingSize: '100',
          servingUnit: 'g',
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/foods/search?query=apple&includeExternal=true')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].source).toBe('openfoodfacts');
    });
  });

  describe('POST /foods', () => {
    it('should create a new food', async () => {
      const createFoodDto = {
        name: 'New Food Item',
        barcode: '5555555555',
        brand: 'Test Brand',
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        fiber: 3,
        sugar: 8,
        sodium: 200,
        servingSize: '50',
        servingUnit: 'g',
      };

      const response = await request(app.getHttpServer())
        .post('/foods')
        .send(createFoodDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...createFoodDto,
        source: FoodSource.MANUAL,
      });
    });

    it('should validate required fields', async () => {
      const createFoodDto = {
        name: 'Incomplete Food',
        // Missing required nutrition fields
      };

      await request(app.getHttpServer())
        .post('/foods')
        .send(createFoodDto)
        .expect(400);
    });

    it('should prevent duplicate barcodes', async () => {
      const createFoodDto = {
        name: 'Duplicate Barcode Food',
        barcode: '1111111111', // Already exists
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        fiber: 3,
        sugar: 8,
        sodium: 200,
        servingSize: '100',
        servingUnit: 'g',
      };

      await request(app.getHttpServer())
        .post('/foods')
        .send(createFoodDto)
        .expect(409);
    });
  });

  describe('GET /foods/:id', () => {
    it('should return a specific food', async () => {
      const foodRepo = dataSource.getRepository(Food);
      const foods = await foodRepo.find();
      const foodId = foods[0].id;

      const response = await request(app.getHttpServer())
        .get(`/foods/${foodId}`)
        .expect(200);

      expect(response.body.id).toBe(foodId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('calories');
    });

    it('should return 404 for non-existent food', async () => {
      await request(app.getHttpServer())
        .get('/foods/99999')
        .expect(404);
    });
  });

  describe('PUT /foods/:id', () => {
    it('should update a food', async () => {
      const foodRepo = dataSource.getRepository(Food);
      const food = await foodRepo.findOne({ where: { name: 'Apple' } });

      const updateFoodDto = {
        name: 'Green Apple',
        calories: 55,
      };

      const response = await request(app.getHttpServer())
        .put(`/foods/${food.id}`)
        .send(updateFoodDto)
        .expect(200);

      expect(response.body.name).toBe('Green Apple');
      expect(response.body.calories).toBe(55);
      expect(response.body.protein).toBe(food.protein); // Unchanged
    });
  });

  describe('DELETE /foods/:id', () => {
    it('should delete a food', async () => {
      const foodRepo = dataSource.getRepository(Food);
      const food = await foodRepo.save({
        name: 'Food to Delete',
        barcode: '6666666666',
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        fiber: 2,
        sugar: 5,
        sodium: 100,
        servingSize: '100',
        servingUnit: 'g',
        source: FoodSource.MANUAL,
      });

      await request(app.getHttpServer())
        .delete(`/foods/${food.id}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/foods/${food.id}`)
        .expect(404);
    });
  });

  describe('POST /foods/cache-external', () => {
    it('should cache an external food', async () => {
      const externalFood = {
        name: 'External Food',
        barcode: '7777777777',
        source: 'openfoodfacts',
        brand: 'External Brand',
        calories: 200,
        protein: 15,
        carbs: 25,
        fat: 8,
        fiber: 4,
        sugar: 10,
        sodium: 300,
        servingSize: '100',
        servingUnit: 'g',
      };

      const response = await request(app.getHttpServer())
        .post('/foods/cache-external')
        .send(externalFood)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...externalFood,
      });

      // Verify it's now searchable locally
      const searchResponse = await request(app.getHttpServer())
        .get('/foods/search?query=External Food')
        .expect(200);

      expect(searchResponse.body).toHaveLength(1);
    });
  });

  describe('GET /foods/meal/:mealId', () => {
    it('should return foods for a specific meal', async () => {
      // This would require creating a meal with food entries
      // For now, we'll test the endpoint exists and returns proper format
      const response = await request(app.getHttpServer())
        .get('/foods/meal/1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /foods/frequent', () => {
    it('should return frequently used foods', async () => {
      const response = await request(app.getHttpServer())
        .get('/foods/frequent')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app.getHttpServer())
        .get('/foods/frequent?limit=2')
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('POST /foods/batch', () => {
    it('should create multiple foods', async () => {
      const foods = [
        {
          name: 'Batch Food 1',
          barcode: '8888888881',
          calories: 100,
          protein: 10,
          carbs: 20,
          fat: 5,
          fiber: 3,
          sugar: 8,
          sodium: 200,
          servingSize: '100',
          servingUnit: 'g',
        },
        {
          name: 'Batch Food 2',
          barcode: '8888888882',
          calories: 150,
          protein: 15,
          carbs: 25,
          fat: 7,
          fiber: 4,
          sugar: 10,
          sodium: 250,
          servingSize: '100',
          servingUnit: 'g',
        },
      ];

      const response = await request(app.getHttpServer())
        .post('/foods/batch')
        .send(foods)
        .expect(201);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Batch Food 1');
      expect(response.body[1].name).toBe('Batch Food 2');
    });
  });
});