import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  nutritionGoalsApi,

  CreateNutritionGoalsDto,
  UpdateNutritionGoalsDto,
  NutritionGoalsQuery,
  GoalPeriod,
  GoalType,
  GoalTemplate,
} from '../api/nutritionGoalsApi';

// Query Keys
export const nutritionGoalsKeys = {
  all: ['nutrition-goals'] as const,
  lists: () => [...nutritionGoalsKeys.all, 'list'] as const,
  list: (filters: NutritionGoalsQuery) => [...nutritionGoalsKeys.lists(), filters] as const,
  details: () => [...nutritionGoalsKeys.all, 'detail'] as const,
  detail: (id: string) => [...nutritionGoalsKeys.details(), id] as const,
  active: (period: GoalPeriod) => [...nutritionGoalsKeys.all, 'active', period] as const,
  progress: (goalId: string, date: string) => [...nutritionGoalsKeys.all, 'progress', goalId, date] as const,
  progressRange: (goalId: string, startDate: string, endDate: string) => 
    [...nutritionGoalsKeys.all, 'progress-range', goalId, startDate, endDate] as const,
  templates: () => [...nutritionGoalsKeys.all, 'templates'] as const,
  recommendations: (goalType: GoalType) => [...nutritionGoalsKeys.all, 'recommendations', goalType] as const,
};

// Hooks
export const useNutritionGoals = (query: NutritionGoalsQuery = {}) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.list(query),
    queryFn: () => nutritionGoalsApi.getGoals(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useNutritionGoal = (id: string) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.detail(id),
    queryFn: () => nutritionGoalsApi.getGoalById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useActiveNutritionGoal = (period: GoalPeriod) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.active(period),
    queryFn: () => nutritionGoalsApi.getActiveGoal(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGoalProgress = (goalId: string, date: string) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.progress(goalId, date),
    queryFn: () => nutritionGoalsApi.getGoalProgress(goalId, date),
    enabled: !!goalId && !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useGoalProgressRange = (goalId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.progressRange(goalId, startDate, endDate),
    queryFn: () => nutritionGoalsApi.getGoalProgressRange(goalId, startDate, endDate),
    enabled: !!goalId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGoalTemplates = () => {
  return useQuery({
    queryKey: nutritionGoalsKeys.templates(),
    queryFn: () => nutritionGoalsApi.getTemplates(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useGoalRecommendations = (goalType: GoalType) => {
  return useQuery({
    queryKey: nutritionGoalsKeys.recommendations(goalType),
    queryFn: () => nutritionGoalsApi.getRecommendations(goalType),
    enabled: !!goalType,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Mutations
export const useCreateNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNutritionGoalsDto) => nutritionGoalsApi.createGoals(data),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.active(data.period) });
      
      toast({
        title: 'Success',
        description: 'Nutrition goals created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create nutrition goals',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNutritionGoalsDto }) =>
      nutritionGoalsApi.updateGoals(id, data),
    onSuccess: (data, variables) => {
      // Update specific goal in cache
      queryClient.setQueryData(nutritionGoalsKeys.detail(variables.id), data);
      
      // Invalidate lists and active goals
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.active(data.period) });
      
      toast({
        title: 'Success',
        description: 'Nutrition goals updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update nutrition goals',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nutritionGoalsApi.deleteGoals(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: nutritionGoalsKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.all });
      
      toast({
        title: 'Success',
        description: 'Nutrition goals deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete nutrition goals',
        variant: 'destructive',
      });
    },
  });
};

export const useActivateNutritionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nutritionGoalsApi.activateGoal(id),
    onSuccess: (data, id) => {
      // Update specific goal in cache
      queryClient.setQueryData(nutritionGoalsKeys.detail(id), data);
      
      // Invalidate lists and active goals
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.active(data.period) });
      
      toast({
        title: 'Success',
        description: `${data.name} is now your active ${data.period} goal`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate nutrition goal',
        variant: 'destructive',
      });
    },
  });
};

export const useDeactivateNutritionGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nutritionGoalsApi.deactivateGoal(id),
    onSuccess: (data, id) => {
      // Update specific goal in cache
      queryClient.setQueryData(nutritionGoalsKeys.detail(id), data);
      
      // Invalidate lists and active goals
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.active(data.period) });
      
      toast({
        title: 'Success',
        description: `${data.name} has been deactivated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate nutrition goal',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: GoalTemplate) => nutritionGoalsApi.createFromTemplate(template),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nutritionGoalsKeys.active(data.period) });
      
      toast({
        title: 'Success',
        description: `${data.name} created from template`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create goals from template',
        variant: 'destructive',
      });
    },
  });
};

// Helper hooks
export const useActiveGoalsForAllPeriods = () => {
  const dailyGoal = useActiveNutritionGoal(GoalPeriod.DAILY);
  const weeklyGoal = useActiveNutritionGoal(GoalPeriod.WEEKLY);
  const monthlyGoal = useActiveNutritionGoal(GoalPeriod.MONTHLY);

  return {
    daily: dailyGoal,
    weekly: weeklyGoal,
    monthly: monthlyGoal,
    isLoading: dailyGoal.isLoading || weeklyGoal.isLoading || monthlyGoal.isLoading,
    hasError: dailyGoal.isError || weeklyGoal.isError || monthlyGoal.isError,
  };
};

export const useTodayProgress = (goalId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  return useGoalProgress(goalId || '', today);
};

export const useWeekProgress = (goalId?: string) => {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  return useGoalProgressRange(goalId || '', startDate, endDate);
};