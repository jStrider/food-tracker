import React, { useMemo, memo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendar } from '@/contexts/CalendarContext';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import ViewSwitcher from './ViewSwitcher';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  onAddMeal?: () => void;
  className?: string;
  showViewSwitcher?: boolean;
  showNavigation?: boolean;
  showAddButton?: boolean;
  customTitle?: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = memo(({
  onAddMeal,
  className,
  showViewSwitcher = true,
  showNavigation = true,
  showAddButton = true,
  customTitle
}) => {
  const { currentDate, viewType } = useCalendar();
  const { navigatePrevious, navigateNext, navigateToToday } = useCalendarNavigation();

  // Memoize title calculation
  const title = useMemo(() => {
    if (customTitle) return customTitle;
    
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week': {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  }, [customTitle, viewType, currentDate]);

  // Memoize class name
  const containerClassName = useMemo(() => 
    cn('flex items-center justify-between mb-6', className),
    [className]
  );

  // Memoize navigation buttons
  const navigationButtons = useMemo(() => {
    if (!showNavigation) return null;

    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={navigatePrevious}
          className="h-8 w-8 p-0"
          aria-label="Previous period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 min-w-[200px] text-center">
          {title}
        </h1>
        
        <Button
          variant="outline"
          size="sm"
          onClick={navigateNext}
          className="h-8 w-8 p-0"
          aria-label="Next period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateToToday}
          className="hidden sm:flex items-center gap-1"
          aria-label="Go to today"
        >
          <Calendar className="h-4 w-4" />
          <span className="text-xs">Today</span>
        </Button>
      </>
    );
  }, [showNavigation, navigatePrevious, navigateNext, navigateToToday, title]);

  // Memoize title without navigation
  const simpleTitle = useMemo(() => {
    if (showNavigation) return null;
    
    return (
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
        {title}
      </h1>
    );
  }, [showNavigation, title]);

  // Memoize add button
  const addButton = useMemo(() => {
    if (!showAddButton || !onAddMeal) return null;
    
    return (
      <Button
        onClick={onAddMeal}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Meal</span>
      </Button>
    );
  }, [showAddButton, onAddMeal]);

  return (
    <div className={containerClassName}>
      <div className="flex items-center space-x-4">
        {navigationButtons}
        {simpleTitle}
      </div>

      <div className="flex items-center space-x-2">
        {showViewSwitcher && <ViewSwitcher />}
        {addButton}
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

export default CalendarHeader;