import React, { useState } from 'react';
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

const CalendarContainerInner: React.FC<CalendarContainerInnerProps> = () => {
  const { date } = useParams<{ date?: string }>();
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    date || format(new Date(), 'yyyy-MM-dd')
  );

  // Use calendar hooks
  const { isLoading, error, viewType } = useCalendarData({
    enableCache: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Enable keyboard shortcuts
  useCalendarKeyboard({
    enabled: true,
    showHelp: true
  });

  const handleAddMeal = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setIsCreateMealModalOpen(true);
  };


  // Show loading skeleton
  if (isLoading) {
    return <CalendarSkeleton viewType={viewType} />;
  }

  // Show error state
  if (error) {
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
  }

  return (
    <div id="calendar-container" className="space-y-6">
      <CalendarHeader onAddMeal={handleAddMeal} />
      
      {/* Render appropriate view based on viewType */}
      {viewType === 'month' && (
        <MonthView />
      )}
      {viewType === 'week' && (
        <WeekView />
      )}
      {viewType === 'day' && (
        <DayView />
      )}

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
};

// Main component with provider
interface CalendarContainerProps {
  initialView?: 'month' | 'week' | 'day';
  initialDate?: Date;
}

export const CalendarContainer: React.FC<CalendarContainerProps> = ({
  initialView = 'month',
  initialDate
}) => {
  const { date } = useParams<{ date?: string }>();
  
  // Parse date from URL if in day view
  const parsedInitialDate = date 
    ? parse(date, 'yyyy-MM-dd', new Date())
    : initialDate || new Date();

  // Determine initial view based on route
  const determinedView = date ? 'day' : initialView;

  return (
    <CalendarProvider initialDate={parsedInitialDate} initialView={determinedView}>
      <CalendarContainerInner initialView={determinedView} />
    </CalendarProvider>
  );
};

export default CalendarContainer;
