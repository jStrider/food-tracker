import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendarApi';
import { format } from 'date-fns';

/**
 * Hook to fetch calendar data for a specific month
 */
export function useMonthData(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return useQuery({
    queryKey: ['calendar-month', month, year],
    queryFn: () => calendarApi.getMonthView(month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch calendar data for a specific week
 */
export function useWeekData(date: Date) {
  const dateString = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['calendar-week', dateString],
    queryFn: () => calendarApi.getWeekView(dateString),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch calendar data for a specific day
 */
export function useDayData(date: string) {
  return useQuery({
    queryKey: ['calendar-day', date],
    queryFn: () => calendarApi.getDayView(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!date,
  });
}

/**
 * Hook to prefetch adjacent calendar data for smooth navigation
 */
export function usePrefetchAdjacentDates() {
  const queryClient = useQueryClient();

  const prefetchMonth = (date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    queryClient.prefetchQuery({
      queryKey: ['calendar-month', month, year],
      queryFn: () => calendarApi.getMonthView(month, year),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchWeek = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    queryClient.prefetchQuery({
      queryKey: ['calendar-week', dateString],
      queryFn: () => calendarApi.getWeekView(dateString),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchDay = (date: string) => {
    queryClient.prefetchQuery({
      queryKey: ['calendar-day', date],
      queryFn: () => calendarApi.getDayView(date),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchMonth,
    prefetchWeek,
    prefetchDay,
  };
}