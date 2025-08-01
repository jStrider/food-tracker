import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NutritionGoals, GoalPeriod, GoalType } from '../entities/nutrition-goals.entity';
import { CreateNutritionGoalsDto, UpdateNutritionGoalsDto, NutritionGoalsQueryDto, GoalTemplateDto } from '../dto/nutrition-goals.dto';
import { NutritionService } from '../nutrition.service';
// SECURITY FIX: Removed TEMP_USER_ID import - now using dynamic user context from controllers

@Injectable()
export class NutritionGoalsService {
  constructor(
    @InjectRepository(NutritionGoals)
    private nutritionGoalsRepository: Repository<NutritionGoals>,
    private nutritionService: NutritionService,
  ) {}

  /**
   * Create new nutrition goals
   */
  async createGoals(createDto: CreateNutritionGoalsDto, userId: string): Promise<NutritionGoals> {
    // Check if there's already an active goal for this period
    if (createDto.period) {
      const existingActiveGoal = await this.nutritionGoalsRepository.findOne({
        where: {
          userId,
          period: createDto.period,
          isActive: true,
        },
      });

      if (existingActiveGoal) {
        throw new ConflictException(
          `An active ${createDto.period} goal already exists. Deactivate it first or create as inactive.`
        );
      }
    }

    // Validate macro consistency
    const macroCalories = (createDto.proteinGoal * 4) + (createDto.carbGoal * 4) + (createDto.fatGoal * 9);
    const difference = Math.abs(createDto.calorieGoal - macroCalories);
    const tolerance = createDto.calorieGoal * 0.1; // 10% tolerance

    if (difference > tolerance) {
      throw new BadRequestException(
        `Macro calories (${macroCalories}) don't match calorie goal (${createDto.calorieGoal}). Difference: ${difference.toFixed(0)} calories.`
      );
    }

    const goals = this.nutritionGoalsRepository.create({
      ...createDto,
      userId,
      isActive: true,
      // Set defaults
      toleranceLower: createDto.toleranceLower || 90,
      toleranceUpper: createDto.toleranceUpper || 110,
      waterGoal: createDto.waterGoal || 2000,
      trackCalories: createDto.trackCalories ?? true,
      trackMacros: createDto.trackMacros ?? true,
      trackMicronutrients: createDto.trackMicronutrients ?? false,
      trackWater: createDto.trackWater ?? true,
    });

    return await this.nutritionGoalsRepository.save(goals);
  }

  /**
   * Get all goals for user
   */
  async getGoals(query: NutritionGoalsQueryDto = {}, userId: string): Promise<NutritionGoals[]> {
    const whereClause: any = { userId };

    if (query.period) {
      whereClause.period = query.period;
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    if (query.goalType) {
      whereClause.goalType = query.goalType;
    }

    return await this.nutritionGoalsRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get goal by ID
   */
  async getGoalById(id: string, userId: string): Promise<NutritionGoals> {
    const goal = await this.nutritionGoalsRepository.findOne({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Nutrition goal not found');
    }

    return goal;
  }

  /**
   * Get active goal for period
   */
  async getActiveGoal(period: GoalPeriod, userId: string): Promise<NutritionGoals | null> {
    return await this.nutritionGoalsRepository.findOne({
      where: {
        userId,
        period,
        isActive: true,
      },
    });
  }

  /**
   * Update nutrition goals
   */
  async updateGoals(id: string, updateDto: UpdateNutritionGoalsDto, userId: string): Promise<NutritionGoals> {
    const goal = await this.getGoalById(id, userId);

    // If activating this goal, deactivate others with same period
    if (updateDto.isActive === true && updateDto.period) {
      await this.nutritionGoalsRepository.update(
        {
          userId,
          period: updateDto.period,
          isActive: true,
          id: { $ne: id } as any,
        },
        { isActive: false }
      );
    }

    // Validate macro consistency if macros are being updated
    if (updateDto.calorieGoal || updateDto.proteinGoal || updateDto.carbGoal || updateDto.fatGoal) {
      const calories = updateDto.calorieGoal || goal.calorieGoal;
      const protein = updateDto.proteinGoal || goal.proteinGoal;
      const carbs = updateDto.carbGoal || goal.carbGoal;
      const fat = updateDto.fatGoal || goal.fatGoal;

      const macroCalories = (protein * 4) + (carbs * 4) + (fat * 9);
      const difference = Math.abs(calories - macroCalories);
      const tolerance = calories * 0.1;

      if (difference > tolerance) {
        throw new BadRequestException(
          `Macro calories (${macroCalories}) don't match calorie goal (${calories}). Difference: ${difference.toFixed(0)} calories.`
        );
      }
    }

    Object.assign(goal, updateDto);
    return await this.nutritionGoalsRepository.save(goal);
  }

  /**
   * Delete nutrition goals
   */
  async deleteGoals(id: string): Promise<void> {
    const result = await this.nutritionGoalsRepository.delete({
      id,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Nutrition goal not found');
    }
  }

  /**
   * Get goal progress for a specific date
   */
  async getGoalProgress(goalId: string, date: string, userId: string) {
    const goal = await this.getGoalById(goalId, userId);
    const nutrition = await this.nutritionService.getDailyNutrition(date, userId);

    const progress = {
      goalId: goal.id,
      goalName: goal.name,
      date,
      period: goal.period,
      nutrition,
      goal,
      percentages: this.calculatePercentages(nutrition, goal),
      status: this.calculateStatus(nutrition, goal),
      macroRatios: {
        actual: this.nutritionService.getMacroBreakdown(nutrition),
        target: goal.calculatedMacroRatios,
      },
      summary: {
        totalGoalsMet: 0,
        totalGoalsTracked: 0,
        overallScore: 0,
      },
    };

    // Calculate summary
    const statusEntries = Object.entries(progress.status);
    progress.summary.totalGoalsTracked = statusEntries.length;
    progress.summary.totalGoalsMet = statusEntries.filter(([_, status]) => status === 'met').length;
    progress.summary.overallScore = Math.round((progress.summary.totalGoalsMet / progress.summary.totalGoalsTracked) * 100);

    return progress;
  }

  /**
   * Get goal progress for date range
   */
  async getGoalProgressRange(goalId: string, startDate: string, endDate: string, userId: string) {
    const goal = await this.getGoalById(goalId, userId);
    const progressData = [];

    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const progress = await this.getGoalProgress(goalId, dateStr, userId);
      progressData.push(progress);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate aggregate statistics
    const aggregates = {
      averageOverallScore: progressData.reduce((sum, p) => sum + p.summary.overallScore, 0) / progressData.length,
      totalGoalsMet: progressData.reduce((sum, p) => sum + p.summary.totalGoalsMet, 0),
      totalPossibleGoals: progressData.length * (progressData[0]?.summary.totalGoalsTracked || 0),
      streaks: this.calculateStreaks(progressData),
      trends: this.calculateTrends(progressData),
    };

    return {
      goal,
      dateRange: { startDate, endDate },
      progressData,
      aggregates,
    };
  }

  /**
   * Create goal from template based on user profile
   */
  async createFromTemplate(templateDto: GoalTemplateDto, userId: string): Promise<NutritionGoals> {
    const calculatedGoals = this.calculateGoalsFromProfile(templateDto);
    
    const createDto: CreateNutritionGoalsDto = {
      name: `${templateDto.goalType.replace('_', ' ').toUpperCase()} Goals`,
      description: `Auto-generated goals for ${templateDto.goalType}`,
      period: GoalPeriod.DAILY,
      goalType: templateDto.goalType,
      ...calculatedGoals,
    };

    return await this.createGoals(createDto, userId);
  }

  /**
   * Get goal templates/presets
   */
  getGoalTemplates(): Record<GoalType, Partial<CreateNutritionGoalsDto>> {
    return {
      [GoalType.WEIGHT_LOSS]: {
        name: 'Weight Loss Goals',
        calorieGoal: 1500,
        proteinGoal: 120,
        carbGoal: 150,
        fatGoal: 50,
        fiberGoal: 25,
        sodiumGoal: 2000,
        waterGoal: 2500,
      },
      [GoalType.WEIGHT_GAIN]: {
        name: 'Weight Gain Goals',
        calorieGoal: 2500,
        proteinGoal: 150,
        carbGoal: 300,
        fatGoal: 90,
        fiberGoal: 30,
        waterGoal: 3000,
      },
      [GoalType.MAINTENANCE]: {
        name: 'Maintenance Goals',
        calorieGoal: 2000,
        proteinGoal: 130,
        carbGoal: 250,
        fatGoal: 70,
        fiberGoal: 25,
        waterGoal: 2500,
      },
      [GoalType.MUSCLE_GAIN]: {
        name: 'Muscle Gain Goals',
        calorieGoal: 2300,
        proteinGoal: 160,
        carbGoal: 250,
        fatGoal: 75,
        fiberGoal: 25,
        waterGoal: 3000,
      },
      [GoalType.ATHLETIC_PERFORMANCE]: {
        name: 'Athletic Performance Goals',
        calorieGoal: 2800,
        proteinGoal: 140,
        carbGoal: 350,
        fatGoal: 90,
        fiberGoal: 30,
        waterGoal: 3500,
      },
      [GoalType.CUSTOM]: {
        name: 'Custom Goals',
        calorieGoal: 2000,
        proteinGoal: 100,
        carbGoal: 250,
        fatGoal: 65,
      },
    };
  }

  /**
   * Private helpers
   */
  private calculatePercentages(nutrition: any, goal: NutritionGoals) {
    return {
      calories: nutrition.calories ? (nutrition.calories / goal.calorieGoal) * 100 : 0,
      protein: nutrition.protein ? (nutrition.protein / goal.proteinGoal) * 100 : 0,
      carbs: nutrition.carbs ? (nutrition.carbs / goal.carbGoal) * 100 : 0,
      fat: nutrition.fat ? (nutrition.fat / goal.fatGoal) * 100 : 0,
      fiber: goal.fiberGoal ? (nutrition.fiber / goal.fiberGoal) * 100 : 0,
      sodium: goal.sodiumGoal ? (nutrition.sodium / goal.sodiumGoal) * 100 : 0,
      water: goal.waterGoal ? ((nutrition.waterIntake || 0) / goal.waterGoal) * 100 : 0,
    };
  }

  private calculateStatus(nutrition: any, goal: NutritionGoals) {
    const percentages = this.calculatePercentages(nutrition, goal);
    
    return {
      calories: goal.getGoalStatus(nutrition.calories || 0, goal.calorieGoal),
      protein: goal.getGoalStatus(nutrition.protein || 0, goal.proteinGoal),
      carbs: goal.getGoalStatus(nutrition.carbs || 0, goal.carbGoal),
      fat: goal.getGoalStatus(nutrition.fat || 0, goal.fatGoal),
      fiber: goal.fiberGoal ? goal.getGoalStatus(nutrition.fiber || 0, goal.fiberGoal) : 'met',
      sodium: goal.sodiumGoal ? goal.getGoalStatus(nutrition.sodium || 0, goal.sodiumGoal) : 'met',
      water: goal.getGoalStatus(nutrition.waterIntake || 0, goal.waterGoal),
    };
  }

  private calculateStreaks(progressData: any[]) {
    let currentStreak = 0;
    let maxStreak = 0;
    let streakType = null;

    for (const progress of progressData.reverse()) {
      const score = progress.summary.overallScore;
      if (score >= 80) { // 80% or better is considered "good"
        currentStreak = streakType === 'good' ? currentStreak + 1 : 1;
        streakType = 'good';
      } else {
        currentStreak = streakType === 'struggling' ? currentStreak + 1 : 1;
        streakType = 'struggling';
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    return { currentStreak, maxStreak, streakType };
  }

  private calculateTrends(progressData: any[]) {
    if (progressData.length < 2) return {};

    const first = progressData[0];
    const last = progressData[progressData.length - 1];

    return {
      overallScore: {
        change: last.summary.overallScore - first.summary.overallScore,
        trend: last.summary.overallScore > first.summary.overallScore ? 'improving' : 'declining',
      },
      calories: {
        change: last.percentages.calories - first.percentages.calories,
        trend: Math.abs(last.percentages.calories - 100) < Math.abs(first.percentages.calories - 100) ? 'improving' : 'declining',
      },
    };
  }

  private calculateGoalsFromProfile(profile: GoalTemplateDto) {
    // Simplified BMR/TDEE calculation (Harris-Benedict equation)
    if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
      return this.getGoalTemplates()[profile.goalType];
    }

    let bmr: number;
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[profile.activityLevel || 'moderate'] || 1.55);

    // Adjust based on goal type
    let calorieAdjustment = 0;
    let proteinMultiplier = 0.8; // g per kg body weight

    switch (profile.goalType) {
      case GoalType.WEIGHT_LOSS:
        calorieAdjustment = -500; // 1 lb per week
        proteinMultiplier = 1.2;
        break;
      case GoalType.WEIGHT_GAIN:
        calorieAdjustment = 500;
        proteinMultiplier = 1.0;
        break;
      case GoalType.MUSCLE_GAIN:
        calorieAdjustment = 200;
        proteinMultiplier = 1.6;
        break;
      case GoalType.ATHLETIC_PERFORMANCE:
        calorieAdjustment = 300;
        proteinMultiplier = 1.4;
        break;
      default:
        proteinMultiplier = 1.0;
    }

    const targetCalories = Math.round(tdee + calorieAdjustment);
    const targetProtein = Math.round(profile.weight * proteinMultiplier);
    const targetFat = Math.round(targetCalories * 0.25 / 9); // 25% of calories from fat
    const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

    return {
      calorieGoal: targetCalories,
      proteinGoal: targetProtein,
      carbGoal: targetCarbs,
      fatGoal: targetFat,
      fiberGoal: 25,
      sodiumGoal: 2300,
      waterGoal: Math.round(profile.weight * 35), // 35ml per kg
    };
  }
}