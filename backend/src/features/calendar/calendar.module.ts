import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { NutritionModule } from '../nutrition/nutrition.module';
import { Meal } from '../meals/entities/meal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal]),
    NutritionModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}