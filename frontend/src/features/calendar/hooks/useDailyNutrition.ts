import { useQuery } from '@tanstack/react-query';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';

interface UseDailyNutritionOptions {
  date: string;
  enabled?: boolean;
}

export const useDailyNutrition = ({ date, enabled = true }: UseDailyNutritionOptions) => {
  const {
    data: dailyNutrition,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['daily-nutrition', date],
    queryFn: () => nutritionApi.getDailyNutrition(date),
    enabled: enabled && !!date,
  });

  return {
    dailyNutrition,
    isLoading,
    error,
    refetch,
  };
};