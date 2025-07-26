import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus, 
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  ParseUUIDPipe,
  Logger 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import { MealsService, PaginatedMeals, DailyNutritionSummary, MealStats } from './meals.service';
import { 
  NutritionIntegrationService, 
  NutritionGoals, 
  NutritionProgress, 
  MacroDistribution 
} from './nutrition-integration.service';
import { 
  CreateMealDto, 
  UpdateMealDto, 
  MealQueryDto, 
  DailyMealsQueryDto,
  MealStatsQueryDto,
  MealResponseDto,
  MealSummaryDto,
  DailyNutritionDto,
  MealStatsDto 
} from './dto';
import { Meal } from './entities/meal.entity';

@ApiTags('meals')
@Controller('meals')
@UseInterceptors(ClassSerializerInterceptor)
export class MealsController {
  private readonly logger = new Logger(MealsController.name);

  constructor(
    private readonly mealsService: MealsService,
    private readonly nutritionIntegrationService: NutritionIntegrationService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all meals with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meals retrieved successfully',
    type: 'PaginatedMeals'
  })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by meal category' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'includeFoods', required: false, description: 'Include food entries' })
  async findAll(@Query(ValidationPipe) query: MealQueryDto): Promise<PaginatedMeals> {
    this.logger.log(`Getting meals with filters: ${JSON.stringify(query)}`);
    return this.mealsService.findAll(query);
  }

  @Get('daily/:date')
  @ApiOperation({ summary: 'Get all meals for a specific date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily meals retrieved successfully',
    type: [MealResponseDto]
  })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'includeFoods', required: false, description: 'Include food entries' })
  async findByDate(
    @Param('date') date: string,
    @Query(ValidationPipe) query: { includeFoods?: boolean }
  ): Promise<Meal[]> {
    this.logger.log(`Getting meals for date: ${date}`);
    return this.mealsService.findByDate({ 
      date, 
      includeFoods: query.includeFoods ?? true 
    });
  }

  @Get('nutrition/:date')
  @ApiOperation({ summary: 'Get daily nutrition summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily nutrition summary retrieved successfully',
    type: DailyNutritionDto
  })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  async getDailyNutrition(@Param('date') date: string): Promise<DailyNutritionSummary> {
    this.logger.log(`Getting daily nutrition for: ${date}`);
    return this.mealsService.getDailyNutrition(date);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get meal statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meal statistics retrieved successfully',
    type: MealStatsDto
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for stats' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for stats' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async getStats(@Query(ValidationPipe) query: MealStatsQueryDto): Promise<MealStats> {
    this.logger.log(`Getting meal stats with filters: ${JSON.stringify(query)}`);
    return this.mealsService.getStats(query);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get meals within date range' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meals in range retrieved successfully',
    type: [MealResponseDto]
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'includeFoods', required: false, description: 'Include food entries' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeFoods') includeFoods?: boolean
  ): Promise<Meal[]> {
    this.logger.log(`Getting meals from ${startDate} to ${endDate}`);
    return this.mealsService.findByDateRange(startDate, endDate, includeFoods ?? true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific meal by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meal retrieved successfully',
    type: MealResponseDto
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiParam({ name: 'id', description: 'Meal UUID' })
  @ApiQuery({ name: 'includeFoods', required: false, description: 'Include food entries' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeFoods') includeFoods?: boolean
  ): Promise<Meal> {
    this.logger.log(`Getting meal: ${id}`);
    return this.mealsService.findOne(id, includeFoods ?? true);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new meal' })
  @ApiResponse({ 
    status: 201, 
    description: 'Meal created successfully',
    type: MealResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateMealDto })
  async create(@Body(ValidationPipe) createMealDto: CreateMealDto): Promise<Meal> {
    this.logger.log(`Creating meal: ${createMealDto.name}`);
    return this.mealsService.create(createMealDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing meal' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meal updated successfully',
    type: MealResponseDto
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiParam({ name: 'id', description: 'Meal UUID' })
  @ApiBody({ type: UpdateMealDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(ValidationPipe) updateMealDto: UpdateMealDto
  ): Promise<Meal> {
    this.logger.log(`Updating meal: ${id}`);
    return this.mealsService.update(id, updateMealDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a meal' })
  @ApiResponse({ status: 204, description: 'Meal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiParam({ name: 'id', description: 'Meal UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Deleting meal: ${id}`);
    await this.mealsService.remove(id);
  }

  // Nutrition Integration Endpoints

  @Post('nutrition/progress/:date')
  @ApiOperation({ summary: 'Calculate nutrition progress against goals' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nutrition progress calculated successfully' 
  })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        fiber: { type: 'number' },
        sugar: { type: 'number' },
        sodium: { type: 'number' },
      },
      required: ['calories', 'protein', 'carbs', 'fat']
    }
  })
  async calculateNutritionProgress(
    @Param('date') date: string,
    @Body() goals: NutritionGoals
  ): Promise<NutritionProgress> {
    this.logger.log(`Calculating nutrition progress for ${date}`);
    return this.nutritionIntegrationService.calculateNutritionProgress(date, goals);
  }

  @Get('nutrition/macros/:date')
  @ApiOperation({ summary: 'Get macro distribution for a specific date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Macro distribution retrieved successfully' 
  })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  async getDailyMacroDistribution(@Param('date') date: string): Promise<MacroDistribution> {
    this.logger.log(`Getting macro distribution for ${date}`);
    return this.nutritionIntegrationService.getDailyMacroDistribution(date);
  }

  @Get('nutrition/macros/meal/:id')
  @ApiOperation({ summary: 'Get macro distribution for a specific meal' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meal macro distribution retrieved successfully' 
  })
  @ApiParam({ name: 'id', description: 'Meal UUID' })
  async getMealMacroDistribution(@Param('id', ParseUUIDPipe) id: string): Promise<MacroDistribution> {
    this.logger.log(`Getting macro distribution for meal: ${id}`);
    return this.nutritionIntegrationService.getMealMacroDistribution(id);
  }

  @Get('nutrition/trends')
  @ApiOperation({ summary: 'Get nutrition trends over a date range' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nutrition trends retrieved successfully' 
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  async getNutritionTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    this.logger.log(`Getting nutrition trends from ${startDate} to ${endDate}`);
    return this.nutritionIntegrationService.calculateNutritionTrends(startDate, endDate);
  }

  @Get('nutrition/optimize/:date')
  @ApiOperation({ summary: 'Get meal optimization suggestions for a date' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meal optimization suggestions retrieved successfully' 
  })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  async getMealOptimization(@Param('date') date: string) {
    this.logger.log(`Getting meal optimization for ${date}`);
    return this.nutritionIntegrationService.suggestMealOptimization(date);
  }
}