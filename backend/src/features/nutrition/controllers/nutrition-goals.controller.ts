import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NutritionGoalsService } from '../services/nutrition-goals.service';
import {
  CreateNutritionGoalsDto,
  UpdateNutritionGoalsDto,
  NutritionGoalsQueryDto,
  NutritionGoalsProgressDto,
  BulkGoalsComparisonDto,
  GoalTemplateDto,
} from '../dto/nutrition-goals.dto';
import { GoalPeriod, GoalType } from '../entities/nutrition-goals.entity';

@ApiTags('nutrition-goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition/goals')
export class NutritionGoalsController {
  constructor(private readonly goalsService: NutritionGoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all nutrition goals for user' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully' })
  async getGoals(@Query() query: NutritionGoalsQueryDto) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.getGoals(query, userId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get goal templates/presets' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  getTemplates() {
    return this.goalsService.getGoalTemplates();
  }

  @Get('active/:period')
  @ApiOperation({ summary: 'Get active goal for specific period' })
  @ApiResponse({ status: 200, description: 'Active goal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active goal found for period' })
  async getActiveGoal(@Param('period') period: GoalPeriod) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.getActiveGoal(period, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get nutrition goal by ID' })
  @ApiResponse({ status: 200, description: 'Goal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async getGoalById(@Param('id', ParseUUIDPipe) id: string) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.getGoalById(id, userId);
  }

  @Get(':id/progress/:date')
  @ApiOperation({ summary: 'Get goal progress for specific date' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  async getGoalProgress(
    @Param('id', ParseUUIDPipe) goalId: string,
    @Param('date') date: string,
  ) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.getGoalProgress(goalId, date, userId);
  }

  @Get(':id/progress/range')
  @ApiOperation({ summary: 'Get goal progress for date range' })
  @ApiResponse({ status: 200, description: 'Progress range retrieved successfully' })
  async getGoalProgressRange(
    @Param('id', ParseUUIDPipe) goalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.getGoalProgressRange(goalId, startDate, endDate, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new nutrition goals' })
  @ApiResponse({ status: 201, description: 'Goals created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid goal data' })
  @ApiResponse({ status: 409, description: 'Active goal already exists for period' })
  async createGoals(@Body() createDto: CreateNutritionGoalsDto) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.createGoals(createDto, userId);
  }

  @Post('from-template')
  @ApiOperation({ summary: 'Create goals from template based on user profile' })
  @ApiResponse({ status: 201, description: 'Goals created from template successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  async createFromTemplate(@Body() templateDto: GoalTemplateDto) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.createFromTemplate(templateDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update nutrition goals' })
  @ApiResponse({ status: 200, description: 'Goals updated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 400, description: 'Invalid goal data' })
  async updateGoals(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNutritionGoalsDto,
  ) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.updateGoals(id, updateDto, userId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate nutrition goal (deactivates others in same period)' })
  @ApiResponse({ status: 200, description: 'Goal activated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @HttpCode(HttpStatus.OK)
  async activateGoal(@Param('id', ParseUUIDPipe) id: string) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.updateGoals(id, { isActive: true }, userId);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate nutrition goal' })
  @ApiResponse({ status: 200, description: 'Goal deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @HttpCode(HttpStatus.OK)
  async deactivateGoal(@Param('id', ParseUUIDPipe) id: string) {
    const userId = 'default-user'; // TODO: Get from auth context
    return await this.goalsService.updateGoals(id, { isActive: false }, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete nutrition goals' })
  @ApiResponse({ status: 204, description: 'Goals deleted successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGoals(@Param('id', ParseUUIDPipe) id: string) {
    const userId = 'default-user'; // TODO: Get from auth context
    await this.goalsService.deleteGoals(id, userId);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get nutrition goals analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalyticsSummary() {
    // This could include aggregated stats like:
    // - Most common goal types
    // - Average goal achievement rates
    // - Popular macro splits
    // - Success patterns
    return {
      message: 'Analytics endpoint - implement based on business requirements',
      availableMetrics: [
        'goal_achievement_rates',
        'popular_macro_ratios',
        'common_goal_types',
        'streak_statistics',
        'seasonal_patterns',
      ],
    };
  }

  @Get('recommendations/:goalType')
  @ApiOperation({ summary: 'Get goal recommendations based on goal type' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(@Param('goalType') goalType: GoalType) {
    const templates = this.goalsService.getGoalTemplates();
    const template = templates[goalType];

    return {
      goalType,
      recommended: template,
      tips: this.getGoalTips(goalType),
      adjustmentStrategies: this.getAdjustmentStrategies(goalType),
    };
  }

  private getGoalTips(goalType: GoalType): string[] {
    const tipsMap = {
      [GoalType.WEIGHT_LOSS]: [
        'Maintain a moderate calorie deficit of 300-500 calories',
        'Prioritize protein to preserve muscle mass',
        'Include high-fiber foods for satiety',
        'Stay well-hydrated to support metabolism',
      ],
      [GoalType.WEIGHT_GAIN]: [
        'Aim for a moderate calorie surplus of 300-500 calories',
        'Focus on nutrient-dense, calorie-rich foods',
        'Include healthy fats like nuts, avocados, and olive oil',
        'Eat frequently throughout the day',
      ],
      [GoalType.MAINTENANCE]: [
        'Monitor your weight regularly and adjust calories as needed',
        'Focus on balanced macronutrient distribution',
        'Prioritize whole, unprocessed foods',
        'Listen to your hunger and fullness cues',
      ],
      [GoalType.MUSCLE_GAIN]: [
        'Ensure adequate protein intake (1.6-2.2g per kg body weight)',
        'Time protein intake around workouts',
        'Include complex carbohydrates for energy',
        'Prioritize recovery and sleep',
      ],
      [GoalType.ATHLETIC_PERFORMANCE]: [
        'Fuel workouts with adequate carbohydrates',
        'Focus on nutrient timing around training',
        'Stay well-hydrated, especially during intense training',
        'Include anti-inflammatory foods for recovery',
      ],
      [GoalType.CUSTOM]: [
        'Regularly assess and adjust goals based on progress',
        'Consider working with a registered dietitian',
        'Track metrics beyond just weight',
        'Be patient and consistent with your approach',
      ],
    };

    return tipsMap[goalType] || [];
  }

  private getAdjustmentStrategies(goalType: GoalType) {
    return {
      plateauBreakers: [
        'Adjust calorie intake by 10-15%',
        'Modify macronutrient ratios',
        'Implement periodic refeeds or diet breaks',
        'Reassess portion sizes and tracking accuracy',
      ],
      progressIndicators: [
        'Body weight trends (weekly averages)',
        'Body composition changes',
        'Performance metrics',
        'Energy levels and mood',
        'Sleep quality',
      ],
      whenToAdjust: [
        'No progress for 2-3 weeks',
        'Significant changes in activity level',
        'Major life events or stress changes',
        'Seasonal adjustments',
      ],
    };
  }
}