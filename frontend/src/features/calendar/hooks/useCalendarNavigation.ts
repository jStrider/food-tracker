import { useState, useCallback } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export type CalendarView = 'month' | 'week' | 'day';

/**
 * Hook to manage calendar navigation state and actions
 */
export function useCalendarNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewType, setViewType] = useState<CalendarView>('month');
  const navigate = useNavigate();

  const navigateToDate = useCallback((date: Date | string) => {
    const dateString = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    navigate(`/day/${dateString}`);
  }, [navigate]);

  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewType) {
        case 'month':
          return subMonths(prev, 1);
        case 'week':
          return subWeeks(prev, 1);
        case 'day':
          return subDays(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewType]);

  const navigateNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewType) {
        case 'month':
          return addMonths(prev, 1);
        case 'week':
          return addWeeks(prev, 1);
        case 'day':
          return addDays(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewType]);

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const changeView = useCallback((newView: CalendarView) => {
    setViewType(newView);
    if (newView === 'day' && viewType !== 'day') {
      navigateToDate(currentDate);
    } else if (newView !== 'day') {
      navigate('/calendar');
    }
  }, [viewType, currentDate, navigate, navigateToDate]);

  return {
    currentDate,
    viewType,
    setCurrentDate,
    setViewType: changeView,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
  };
}