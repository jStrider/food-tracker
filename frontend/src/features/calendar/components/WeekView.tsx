import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { getNavigationLabel } from '@/utils/accessibility';

// Modular components
import CalendarHeader from './shared/CalendarHeader';
import WeekDayCard from './shared/WeekDayCard';

// Custom hooks
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';

const WeekView: React.FC = () => {
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { announce, createLiveRegion } = useAnnouncements();
  
  // Custom hooks
  const { currentDate, navigatePrevious, navigateNext } = useCalendarNavigation({
    navigationType: 'week',
  });
  
  // Focus management for modal
  const { containerRef: modalRef } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekData, isLoading, error } = useQuery({
    queryKey: ['calendar-week', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => calendarApi.getWeekView(format(weekStart, 'yyyy-MM-dd')),
  });

  const getDayData = (date: Date) => {
    if (!weekData?.days) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return weekData.days.find((day: any) => day.date === dateString);
  };

  const handleAddMealClick = (date: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event bubbling
    setSelectedDate(date);
    setIsCreateMealModalOpen(true);
    const dateObj = new Date(date);
    announce(`Opening add meal dialog for ${format(dateObj, 'EEEE, MMMM d, yyyy')}`);
  };

  const handleNavigateDay = (date: Date) => {
    announce(`Navigating to ${format(date, 'EEEE, MMMM d, yyyy')}`);
  };

  const handleAddMealToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setIsCreateMealModalOpen(true);
    announce('Opening add meal dialog for today');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <div className="text-red-800">
          <h2 className="text-lg font-semibold mb-2">Failed to load week view</h2>
          <p>Please try refreshing the page. If the problem persists, check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarHeader
        title={`${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onAddMeal={handleAddMealToday}
        previousLabel={getNavigationLabel('previous', 'week', subWeeks(weekStart, 1))}
        nextLabel={getNavigationLabel('next', 'week', addWeeks(weekStart, 1))}
        showAddButton={true}
      />

      {/* Week grid instructions */}
      <div
        id="week-instructions"
        className="sr-only"
        aria-live="polite"
      >
        Week view grid. Use Tab to navigate between days, Enter to view day details.
        Current week is {format(weekStart, 'MMMM d')} to {format(weekEnd, 'MMMM d, yyyy')}.
      </div>

      <div 
        className="grid grid-cols-7 gap-4"
        role="grid"
        aria-label={`Week of ${format(weekStart, 'MMMM d, yyyy')}`}
        aria-describedby="week-instructions"
      >
        {weekDays.map((date, index) => {
          const dayData = getDayData(date);
          
          return (
            <WeekDayCard
              key={format(date, 'yyyy-MM-dd')}
              date={date}
              dayData={dayData}
              onAddMeal={handleAddMealClick}
              tabIndex={index === 0 ? 0 : -1}
              onNavigate={() => handleNavigateDay(date)}
            />
          );
        })}
      </div>

      <div ref={modalRef as React.RefObject<HTMLDivElement>}>
        <CreateMealModal
          open={isCreateMealModalOpen}
          onOpenChange={setIsCreateMealModalOpen}
          defaultDate={selectedDate}
        />
      </div>

      {/* Live region for announcements */}
      {createLiveRegion()}
    </div>
  );
};

export default WeekView;