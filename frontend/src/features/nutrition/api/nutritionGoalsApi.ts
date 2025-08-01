import { apiClient } from '@/utils/apiClient';

// Enhanced nutrition goals types
export enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MAINTENANCE = 'maintenance',
  MUSCLE_GAIN = 'muscle_gain',
  ATHLETIC_PERFORMANCE = 'athletic_performance',
  CUSTOM = 'custom',
}

export interface NutritionGoalsEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  period: GoalPeriod;
  goalType: GoalType;
  isActive: boolean;
  
  // Core macronutrients
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  
  // Extended nutrition goals
  fiberGoal?: number;
  sugarGoal?: number;
  sodiumGoal?: number;
  saturatedFatGoal?: number;
  cholesterolGoal?: number;
  potassiumGoal?: number;
  
  // Vitamin goals
  vitaminAGoal?: number;
  vitaminCGoal?: number;
  calciumGoal?: number;
  ironGoal?: number;
  
  // Hydration goal
  waterGoal: number;
  
  // Goal ranges
  toleranceLower: number;
  toleranceUpper: number;
  
  // Macro ratios
  proteinPercentage?: number;
  carbPercentage?: number;
  fatPercentage?: number;
  
  // Date range
  startDate?: string;
  endDate?: string;
  
  // Goal settings
  trackCalories: boolean;
  trackMacros: boolean;
  trackMicronutrients: boolean;
  trackWater: boolean;
  
  // Reminders
  enableReminders: boolean;
  reminderTimes?: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionGoalsDto {
  name: string;
  description?: string;
  period: GoalPeriod;
  goalType: GoalType;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  fiberGoal?: number;
  sugarGoal?: number;
  sodiumGoal?: number;
  saturatedFatGoal?: number;
  cholesterolGoal?: number;
  potassiumGoal?: number;
  vitaminAGoal?: number;
  vitaminCGoal?: number;
  calciumGoal?: number;
  ironGoal?: number;
  waterGoal?: number;
  toleranceLower?: number;
  toleranceUpper?: number;
  proteinPercentage?: number;
  carbPercentage?: number;
  fatPercentage?: number;
  startDate?: string;
  endDate?: string;
  trackCalories?: boolean;
  trackMacros?: boolean;
  trackMicronutrients?: boolean;
  trackWater?: boolean;
  enableReminders?: boolean;
  reminderTimes?: string[];
}

export interface UpdateNutritionGoalsDto extends Partial<CreateNutritionGoalsDto> {
  isActive?: boolean;
}

export interface NutritionGoalsQuery {
  period?: GoalPeriod;
  isActive?: boolean;
  goalType?: GoalType;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  date: string;
  period: GoalPeriod;
  nutrition: any; // DailyNutrition from nutritionApi
  goal: NutritionGoalsEntity;
  percentages: Record<string, number>;
  status: Record<string, 'under' | 'met' | 'over'>;
  macroRatios: {
    actual: { protein: number; carbs: number; fat: number };
    target: { protein: number; carbs: number; fat: number };
  };
  summary: {
    totalGoalsMet: number;
    totalGoalsTracked: number;
    overallScore: number;
  };
}

export interface GoalProgressRange {
  goal: NutritionGoalsEntity;
  dateRange: { startDate: string; endDate: string };
  progressData: GoalProgress[];
  aggregates: {
    averageOverallScore: number;
    totalGoalsMet: number;
    totalPossibleGoals: number;
    streaks: {
      currentStreak: number;
      maxStreak: number;
      streakType: string;
    };
    trends: {
      overallScore: { change: number; trend: string };
      calories: { change: number; trend: string };
    };
  };
}

export interface GoalTemplate {
  goalType: GoalType;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

// Nutrition Goals API
export const nutritionGoalsApi = {
  // Get all goals
  getGoals: async (query: NutritionGoalsQuery = {}): Promise<NutritionGoalsEntity[]> => {
    const params = new URLSearchParams();
    if (query.period) params.append('period', query.period);
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query.goalType) params.append('goalType', query.goalType);
    
    const response = await apiClient.get(`/nutrition/goals?${params}`);
    return response.data;
  },

  // Get goal by ID
  getGoalById: async (id: string): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.get(`/nutrition/goals/${id}`);
    return response.data;
  },

  // Get active goal for period
  getActiveGoal: async (period: GoalPeriod): Promise<NutritionGoalsEntity | null> => {
    try {
      const response = await apiClient.get(`/nutrition/goals/active/${period}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create goals
  createGoals: async (data: CreateNutritionGoalsDto): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.post('/nutrition/goals', data);
    return response.data;
  },

  // Update goals
  updateGoals: async (id: string, data: UpdateNutritionGoalsDto): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.put(`/nutrition/goals/${id}`, data);
    return response.data;
  },

  // Delete goals
  deleteGoals: async (id: string): Promise<void> => {
    await apiClient.delete(`/nutrition/goals/${id}`);
  },

  // Activate goal
  activateGoal: async (id: string): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.put(`/nutrition/goals/${id}/activate`);
    return response.data;
  },

  // Deactivate goal
  deactivateGoal: async (id: string): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.put(`/nutrition/goals/${id}/deactivate`);
    return response.data;
  },

  // Get goal progress for date
  getGoalProgress: async (goalId: string, date: string): Promise<GoalProgress> => {
    const response = await apiClient.get(`/nutrition/goals/${goalId}/progress/${date}`);
    return response.data;
  },

  // Get goal progress for date range
  getGoalProgressRange: async (goalId: string, startDate: string, endDate: string): Promise<GoalProgressRange> => {
    const response = await apiClient.get(`/nutrition/goals/${goalId}/progress/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get goal templates
  getTemplates: async (): Promise<Record<GoalType, Partial<CreateNutritionGoalsDto>>> => {
    const response = await apiClient.get('/nutrition/goals/templates');
    return response.data;
  },

  // Create from template
  createFromTemplate: async (template: GoalTemplate): Promise<NutritionGoalsEntity> => {
    const response = await apiClient.post('/nutrition/goals/from-template', template);
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (goalType: GoalType) => {
    const response = await apiClient.get(`/nutrition/goals/recommendations/${goalType}`);
    return response.data;
  },
};