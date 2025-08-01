import { useState, useCallback } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { getNavigationLabel } from '@/utils/accessibility';

type NavigationType = 'month' | 'week' | 'day';

interface UseCalendarNavigationOptions {
  initialDate?: Date;
  navigationType: NavigationType;
}

export const useCalendarNavigation = (options: UseCalendarNavigationOptions) => {
  const { initialDate = new Date(), navigationType } = options;
  const [currentDate, setCurrentDate] = useState(initialDate);
  const navigate = useNavigate();
  const { announce } = useAnnouncements();

  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => {
      let newDate: Date;
      switch (navigationType) {
        case 'month':
          newDate = subMonths(prev, 1);
          break;
        case 'week':
          newDate = subWeeks(prev, 1);
          break;
        case 'day':
          newDate = subDays(prev, 1);
          break;
      }
      
      const label = getNavigationLabel('previous', navigationType, newDate);
      announce(label);
      
      if (navigationType === 'day') {
        navigate(`/day/${format(newDate, 'yyyy-MM-dd')}`);
      }
      
      return newDate;
    });
  }, [navigationType, navigate, announce]);

  const navigateNext = useCallback(() => {
    setCurrentDate(prev => {
      let newDate: Date;
      switch (navigationType) {
        case 'month':
          newDate = addMonths(prev, 1);
          break;
        case 'week':
          newDate = addWeeks(prev, 1);
          break;
        case 'day':
          newDate = addDays(prev, 1);
          break;
      }
      
      const label = getNavigationLabel('next', navigationType, newDate);
      announce(label);
      
      if (navigationType === 'day') {
        navigate(`/day/${format(newDate, 'yyyy-MM-dd')}`);
      }
      
      return newDate;
    });
  }, [navigationType, navigate, announce]);

  const navigateToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    announce('Navigated to today');
    
    if (navigationType === 'day') {
      navigate(`/day/${format(today, 'yyyy-MM-dd')}`);
    }
  }, [navigationType, navigate, announce]);

  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date);
    announce(`Navigated to ${format(date, 'MMMM d, yyyy')}`);
    
    if (navigationType === 'day') {
      navigate(`/day/${format(date, 'yyyy-MM-dd')}`);
    }
  }, [navigationType, navigate, announce]);

  return {
    currentDate,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
  };
};