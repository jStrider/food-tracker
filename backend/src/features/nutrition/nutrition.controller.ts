import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NutritionService, NutritionGoals } from './nutrition.service';

@ApiTags('nutrition')
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily nutrition summary' })
  @ApiResponse({ status: 200, description: 'Daily nutrition data' })
  getDailyNutrition(@Query('date') date: string) {
    return this.nutritionService.getDailyNutrition(date);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly nutrition summary' })
  @ApiResponse({ status: 200, description: 'Weekly nutrition data' })
  getWeeklyNutrition(@Query('startDate') startDate: string) {
    return this.nutritionService.getWeeklyNutrition(startDate);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly nutrition summary' })
  @ApiResponse({ status: 200, description: 'Monthly nutrition data' })
  getMonthlyNutrition(@Query('month') month: string, @Query('year') year: string) {
    return this.nutritionService.getMonthlyNutrition(parseInt(month), parseInt(year));
  }

  @Get('meal/:id')
  @ApiOperation({ summary: 'Get nutrition for a specific meal' })
  @ApiResponse({ status: 200, description: 'Meal nutrition data' })
  getMealNutrition(@Param('id') id: string) {
    return this.nutritionService.getMealNutrition(id);
  }

  @Post('goals/compare')
  @ApiOperation({ summary: 'Compare daily nutrition to goals' })
  @ApiResponse({ status: 200, description: 'Goal comparison data' })
  compareToGoals(
    @Query('date') date: string,
    @Body() goals: NutritionGoals,
  ) {
    return this.nutritionService.compareToGoals(date, goals);
  }

  @Get('macro-breakdown')
  @ApiOperation({ summary: 'Get macronutrient breakdown percentages' })
  @ApiResponse({ status: 200, description: 'Macro breakdown data' })
  async getMacroBreakdown(@Query('date') date: string) {
    const nutrition = await this.nutritionService.getDailyNutrition(date);
    return this.nutritionService.getMacroBreakdown(nutrition);
  }
}