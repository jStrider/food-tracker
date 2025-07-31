import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useCalendarData } from '../hooks/useCalendarData';
import { useCalendarKeyboard } from '../hooks/useCalendarKeyboard';
import CalendarHeader from './shared/CalendarHeader';
import CalendarSkeleton from './shared/CalendarSkeleton';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import { format, parse } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CalendarContainerInnerProps {
  initialView?: 'month' | 'week' | 'day';
}

const CalendarContainerInner: React.FC<CalendarContainerInnerProps> = React.memo(() => {
  const { date } = useParams<{ date?: string }>();
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    date || format(new Date(), 'yyyy-MM-dd')
  );

  // Memoize calendar data options
  const calendarDataOptions = useMemo(() => ({
    enableCache: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }), []);

  // Use calendar hooks
  const { isLoading, error, viewType } = useCalendarData(calendarDataOptions);

  // Memoize keyboard options
  const keyboardOptions = useMemo(() => ({
    enabled: true,
    showHelp: true
  }), []);

  // Enable keyboard shortcuts
  useCalendarKeyboard(keyboardOptions);

  const handleAddMeal = useCallback(() => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setIsCreateMealModalOpen(true);
  }, []);

  // Memoize error content
  const errorContent = useMemo(() => {
    if (!error) return null;
    
    return (
      <div className="space-y-6">
        <CalendarHeader onAddMeal={handleAddMeal} showNavigation={false} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load calendar data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }, [error, handleAddMeal]);

  // Show loading skeleton
  if (isLoading) {
    return <CalendarSkeleton viewType={viewType} />;
  }

  // Show error state
  if (error) {
    return errorContent;
  }

  // Memoize view component
  const viewComponent = useMemo(() => {
    switch (viewType) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return null;
    }
  }, [viewType]);

  return (
    <div id="calendar-container" className="space-y-6">
      <CalendarHeader onAddMeal={handleAddMeal} />
      
      {/* Render appropriate view */}
      {viewComponent}

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
});

CalendarContainerInner.displayName = 'CalendarContainerInner';

// Main component with provider
interface CalendarContainerProps {
  initialView?: 'month' | 'week' | 'day';
  initialDate?: Date;
}

export const CalendarContainer: React.FC<CalendarContainerProps> = React.memo(({
  initialView = 'month',
  initialDate
}) => {
  const { date } = useParams<{ date?: string }>();
  
  // Memoize parsed initial date
  const parsedInitialDate = useMemo(() => {
    return date 
      ? parse(date, 'yyyy-MM-dd', new Date())
      : initialDate || new Date();
  }, [date, initialDate]);

  // Memoize determined view
  const determinedView = useMemo(() => {
    return date ? 'day' : initialView;
  }, [date, initialView]);

  return (
    <CalendarProvider initialDate={parsedInitialDate} initialView={determinedView}>
      <CalendarContainerInner initialView={determinedView} />
    </CalendarProvider>
  );
});

CalendarContainer.displayName = 'CalendarContainer';

export default CalendarContainer;