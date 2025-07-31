import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useCalendar } from '@/contexts/CalendarContext';

export interface CalendarNavigationOptions {
  enableKeyboardShortcuts?: boolean;
  enableSwipeGestures?: boolean;
  onDateChange?: (date: Date) => void;
}

export const useCalendarNavigation = (options: CalendarNavigationOptions = {}) => {
  const {
    enableKeyboardShortcuts = true,
    enableSwipeGestures = false,
    onDateChange
  } = options;

  const navigate = useNavigate();
  const { date } = useParams<{ date?: string }>();
  const {
    currentDate,
    viewType,
    goToDate,
    goToToday,
    goToPreviousPeriod,
    goToNextPeriod,
    switchView,
    selectDate
  } = useCalendar();

  // Navigate to specific date with view type
  const navigateToDate = useCallback((targetDate: Date, view = viewType) => {
    goToDate(targetDate);
    
    if (view === 'day') {
      const dateString = format(targetDate, 'yyyy-MM-dd');
      navigate(`/day/${dateString}`);
    } else {
      navigate('/calendar');
    }
    
    onDateChange?.(targetDate);
  }, [goToDate, navigate, viewType, onDateChange]);

  // Quick navigation methods
  const navigateToToday = useCallback(() => {
    const today = new Date();
    goToToday();
    
    if (viewType === 'day') {
      navigate(`/day/${format(today, 'yyyy-MM-dd')}`);
    } else {
      navigate('/calendar');
    }
    
    onDateChange?.(today);
  }, [goToToday, navigate, viewType, onDateChange]);

  const navigatePrevious = useCallback(() => {
    goToPreviousPeriod();
    // The context handles date calculation, we just need to update URL if needed
    if (viewType === 'day' && date) {
      const [year, month, day] = date.split('-').map(Number);
      const prevDate = new Date(year, month - 1, day - 1);
      navigate(`/day/${format(prevDate, 'yyyy-MM-dd')}`);
    }
  }, [goToPreviousPeriod, viewType, date, navigate]);

  const navigateNext = useCallback(() => {
    goToNextPeriod();
    // The context handles date calculation, we just need to update URL if needed
    if (viewType === 'day' && date) {
      const [year, month, day] = date.split('-').map(Number);
      const nextDate = new Date(year, month - 1, day + 1);
      navigate(`/day/${format(nextDate, 'yyyy-MM-dd')}`);
    }
  }, [goToNextPeriod, viewType, date, navigate]);

  // View switching with URL update
  const changeView = useCallback((newView: 'month' | 'week' | 'day') => {
    switchView(newView);
    
    if (newView === 'day') {
      const targetDate = date ? new Date(date) : currentDate;
      navigate(`/day/${format(targetDate, 'yyyy-MM-dd')}`);
    } else {
      navigate('/calendar');
    }
  }, [switchView, navigate, date, currentDate]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          navigateToToday();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          changeView('month');
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          changeView('week');
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          changeView('day');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, navigatePrevious, navigateNext, navigateToToday, changeView]);

  // Touch gesture support (basic implementation)
  useEffect(() => {
    if (!enableSwipeGestures) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left - go to next period
          navigateNext();
        } else {
          // Swiped right - go to previous period
          navigatePrevious();
        }
      }
    };

    const calendarElement = document.getElementById('calendar-container');
    if (calendarElement) {
      calendarElement.addEventListener('touchstart', handleTouchStart);
      calendarElement.addEventListener('touchend', handleTouchEnd);

      return () => {
        calendarElement.removeEventListener('touchstart', handleTouchStart);
        calendarElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [enableSwipeGestures, navigateNext, navigatePrevious]);

  // Utility to check if navigation is possible
  const canNavigate = useCallback((): boolean => {
    // For now, always allow navigation
    // In the future, we could limit based on data availability
    return true;
  }, []);

  return {
    // Navigation methods
    navigateToDate,
    navigateToToday,
    navigatePrevious,
    navigateNext,
    changeView,
    selectDate,
    
    // State
    currentDate,
    viewType,
    
    // Utilities
    canNavigate,
    
    // Formatted strings for display
    formattedDate: format(currentDate, 'MMMM yyyy'),
    formattedShortDate: format(currentDate, 'MMM yyyy')
  };
};
