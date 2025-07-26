import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { OpenFoodFactsService } from './open-food-facts.service';
import { FoodCacheService } from './food-cache.service';
import { FoodsHealthService } from './foods.health';
import { Food } from './entities/food.entity';
import { FoodEntry } from './entities/food-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Food, FoodEntry]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [FoodsController],
  providers: [FoodsService, OpenFoodFactsService, FoodCacheService, FoodsHealthService],
  exports: [FoodsService, FoodCacheService],
})
export class FoodsModule {}