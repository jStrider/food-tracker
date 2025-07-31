import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useMonthData, useWeekData, useDayData, usePrefetchAdjacentDates } from '../useCalendarData';
import { calendarApi } from '../../api/calendarApi';

vi.mock('../../api/calendarApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCalendarData hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthData', () => {
    it('should fetch month data for given date', async () => {
      const mockData = {
        month: 1,
        year: 2024,
        days: [{ 
          date: '2024-01-01', 
          totalCalories: 2000,
          totalProtein: 50,
          totalCarbs: 250,
          totalFat: 75,
          mealCount: 3,
          hasData: true,
        }],
        summary: { 
          totalDays: 31,
          daysWithData: 1,
          averageCalories: 2000,
          totalCalories: 2000,
          averageProtein: 50,
          averageCarbs: 250,
          averageFat: 75,
        },
      };
      
      vi.mocked(calendarApi.getMonthView).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useMonthData(new Date('2024-01-15')),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(calendarApi.getMonthView).toHaveBeenCalledWith(1, 2024);
      expect(result.current.data).toEqual(mockData);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(calendarApi.getMonthView).mockRejectedValueOnce(error);

      const { result } = renderHook(
        () => useMonthData(new Date('2024-01-15')),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useWeekData', () => {
    it('should fetch week data for given date', async () => {
      const mockData = {
        days: [{ 
          date: '2024-01-15', 
          totalCalories: 2000,
          totalProtein: 50,
          totalCarbs: 250,
          totalFat: 75,
          mealCount: 3,
          hasData: true,
        }],
        summary: { 
          totalDays: 7,
          daysWithData: 1,
          averageCalories: 2000,
          totalCalories: 2000,
          averageProtein: 50,
          averageCarbs: 250,
          averageFat: 75,
        },
      };
      
      vi.mocked(calendarApi.getWeekView).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useWeekData(new Date('2024-01-15')),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(calendarApi.getWeekView).toHaveBeenCalledWith('2024-01-15');
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useDayData', () => {
    it('should fetch day data for given date string', async () => {
      const mockData = {
        date: '2024-01-15',
        meals: [{ id: '1', name: 'Breakfast', calories: 500 }],
        totalCalories: 500,
      };
      
      vi.mocked(calendarApi.getDayView).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useDayData('2024-01-15'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(calendarApi.getDayView).toHaveBeenCalledWith('2024-01-15');
      expect(result.current.data).toEqual(mockData);
    });

    it('should not fetch if date is empty', () => {
      const { result } = renderHook(
        () => useDayData(''),
        { wrapper: createWrapper() }
      );

      // The query is disabled when date is empty, so it won't be loading
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(calendarApi.getDayView).not.toHaveBeenCalled();
    });
  });

  describe('usePrefetchAdjacentDates', () => {
    it('should provide prefetch functions for different view types', () => {
      const queryClient = new QueryClient();
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue();
      
      // Mock the API calls to return valid data
      vi.mocked(calendarApi.getMonthView).mockResolvedValue({
        month: 2,
        year: 2024,
        days: [],
        summary: { 
          totalDays: 28,
          daysWithData: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0,
        },
      });
      vi.mocked(calendarApi.getWeekView).mockResolvedValue({
        days: [],
        summary: { 
          totalDays: 7,
          daysWithData: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0,
        },
      });
      vi.mocked(calendarApi.getDayView).mockResolvedValue({
        date: '2024-01-16',
        meals: [],
        totalCalories: 0,
      });
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(
        () => usePrefetchAdjacentDates(),
        { wrapper }
      );

      expect(result.current).toHaveProperty('prefetchMonth');
      expect(result.current).toHaveProperty('prefetchWeek');
      expect(result.current).toHaveProperty('prefetchDay');
      
      // Test prefetchMonth
      result.current.prefetchMonth(new Date('2024-02-15'));
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calendar-month', 2, 2024],
        })
      );

      // Test prefetchWeek
      result.current.prefetchWeek(new Date('2024-01-22'));
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calendar-week', '2024-01-22'],
        })
      );

      // Test prefetchDay
      result.current.prefetchDay('2024-01-16');
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['calendar-day', '2024-01-16'],
        })
      );
    });
  });
});