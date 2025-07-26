import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { MealsModule } from '../features/meals/meals.module';
import { FoodsModule } from '../features/foods/foods.module';
import { NutritionModule } from '../features/nutrition/nutrition.module';

@Module({
  imports: [MealsModule, FoodsModule, NutritionModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}