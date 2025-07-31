import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import { useCalendar, calendarQueryKeys } from '@/contexts/CalendarContext';
import { calendarApi } from '../api/calendarApi';

interface UseCalendarDataOptions {
  enableCache?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export const useCalendarData = (options: UseCalendarDataOptions = {}) => {
  const {
    enableCache = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval = undefined
  } = options;

  const queryClient = useQueryClient();
  const {
    currentDate,
    viewType,
    getCachedData,
    setCachedData
  } = useCalendar();

  // Generate cache key based on view type and date
  const getCacheKey = () => {
    switch (viewType) {
      case 'month':
        return `month-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return `week-${format(weekStart, 'yyyy-MM-dd')}`;
      case 'day':
        return `day-${format(currentDate, 'yyyy-MM-dd')}`;
    }
  };

  // Fetch data based on current view type
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: viewType === 'month' 
      ? calendarQueryKeys.month(currentDate.getFullYear(), currentDate.getMonth() + 1)
      : viewType === 'week'
      ? calendarQueryKeys.week(format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      : calendarQueryKeys.day(format(currentDate, 'yyyy-MM-dd')),
    
    queryFn: async () => {
      // Check context cache first
      if (enableCache) {
        const cachedData = getCachedData(getCacheKey());
        if (cachedData) {
          return cachedData;
        }
      }

      // Fetch from API
      let apiData;
      switch (viewType) {
        case 'month':
          apiData = await calendarApi.getMonthView(
            currentDate.getMonth() + 1,
            currentDate.getFullYear()
          );
          break;
        case 'week':
          apiData = await calendarApi.getWeekView(
            format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
          );
          break;
        case 'day':
          apiData = await calendarApi.getDayView(
            format(currentDate, 'yyyy-MM-dd')
          );
          break;
      }

      // Store in context cache
      if (enableCache && apiData) {
        setCachedData(getCacheKey(), apiData);
      }

      return apiData;
    },
    
    staleTime,
    refetchInterval,
    
    // Keep previous data while fetching new data
    keepPreviousData: true,
  });

  // Prefetch adjacent periods for smoother navigation
  const prefetchAdjacentPeriods = async () => {
    switch (viewType) {
      case 'month':
        // Prefetch previous and next month
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: calendarQueryKeys.month(prevMonth.getFullYear(), prevMonth.getMonth() + 1),
            queryFn: () => calendarApi.getMonthView(prevMonth.getMonth() + 1, prevMonth.getFullYear()),
            staleTime
          }),
          queryClient.prefetchQuery({
            queryKey: calendarQueryKeys.month(nextMonth.getFullYear(), nextMonth.getMonth() + 1),
            queryFn: () => calendarApi.getMonthView(nextMonth.getMonth() + 1, nextMonth.getFullYear()),
            staleTime
          })
        ]);
        break;
        
      case 'week':
        // Prefetch previous and next week
        const prevWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const prevWeekStart = format(startOfWeek(prevWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const nextWeekStart = format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: calendarQueryKeys.week(prevWeekStart),
            queryFn: () => calendarApi.getWeekView(prevWeekStart),
            staleTime
          }),
          queryClient.prefetchQuery({
            queryKey: calendarQueryKeys.week(nextWeekStart),
            queryFn: () => calendarApi.getWeekView(nextWeekStart),
            staleTime
          })
        ]);
        break;
    }
  };

  // Invalidate calendar queries (useful after meal CRUD operations)
  const invalidateCalendarData = async () => {
    await queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
  };

  // Get aggregated statistics for current view
  const getViewStatistics = () => {
    if (!data) return null;

    switch (viewType) {
      case 'month':
        return data.summary || null;
      case 'week':
        // Calculate week statistics from day data
        const weekDays = data.days || [];
        const totalCalories = weekDays.reduce((sum: number, day: any) => sum + (day.totalCalories || 0), 0);
        const daysWithData = weekDays.filter((day: any) => day.hasData).length;
        const averageCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
        
        return {
          totalCalories,
          daysWithData,
          averageCalories,
          totalMeals: weekDays.reduce((sum: number, day: any) => sum + (day.mealCount || 0), 0)
        };
      case 'day':
        // Day view returns nutrition data directly
        return {
          totalCalories: data.calories || 0,
          totalProtein: data.protein || 0,
          totalCarbs: data.carbs || 0,
          totalFat: data.fat || 0,
          mealCount: data.meals?.length || 0
        };
    }
  };

  return {
    // Data and state
    data,
    isLoading,
    error,
    
    // Actions
    refetch,
    prefetchAdjacentPeriods,
    invalidateCalendarData,
    
    // Computed values
    statistics: getViewStatistics(),
    isEmpty: !data || (Array.isArray(data.days) ? data.days.length === 0 : !data.meals?.length),
    
    // View info
    viewType,
    currentDate
  };
};
