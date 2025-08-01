import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import { Link } from 'react-router-dom';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { getDateLabel, getNavigationLabel, formatTimeForScreenReader } from '@/utils/accessibility';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { announce, createLiveRegion } = useAnnouncements();
  
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
      const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
      const newWeekEnd = endOfWeek(newDate, { weekStartsOn: 1 });
      const label = getNavigationLabel(
        direction === 'prev' ? 'previous' : 'next',
        'week',
        newWeekStart
      );
      announce(`${label}, ${format(newWeekStart, 'MMM d')} to ${format(newWeekEnd, 'MMM d, yyyy')}`);
      return newDate;
    });
  };

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
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4" role="group" aria-label="Week navigation">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('prev')}
            aria-label={getNavigationLabel('previous', 'week', subWeeks(weekStart, 1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 
            className="text-2xl font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('next')}
            aria-label={getNavigationLabel('next', 'week', addWeeks(weekStart, 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        
        <Button 
          onClick={() => {
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCreateMealModalOpen(true);
            announce('Opening add meal dialog for today');
          }}
          aria-describedby="add-meal-description"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Meal
        </Button>
        <div id="add-meal-description" className="sr-only">
          Add a new meal for today's date
        </div>
      </header>

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
          const dateString = format(date, 'yyyy-MM-dd');
          const dayLabel = getDateLabel(date, 'calendar', {
            hasData: dayData?.hasData,
            mealCount: dayData?.mealCount,
            totalCalories: dayData?.totalCalories,
          });
          
          return (
            <div
              key={dateString}
              role="gridcell"
              className="h-40"
            >
              <Card
                className={`h-full cursor-pointer transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 ${
                  isToday(date) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <CardContent className="p-3 h-full relative group">
                  <Link 
                    to={`/day/${dateString}`} 
                    className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
                    aria-label={dayLabel}
                    tabIndex={index === 0 ? 0 : -1}
                    onClick={() => announce(`Navigating to ${dayLabel}`)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="text-center border-b pb-2 mb-2 relative">
                        <div 
                          className="text-xs text-gray-500 uppercase"
                          aria-hidden="true"
                        >
                          {format(date, 'EEE')}
                        </div>
                        <div 
                          className="text-lg font-semibold text-gray-900"
                          aria-hidden="true"
                        >
                          {format(date, 'd')}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-0 right-0 h-6 w-6 p-0 opacity-40 hover:opacity-100 transition-opacity"
                          onClick={(e) => handleAddMealClick(dateString, e)}
                          aria-label={`Add meal for ${format(date, 'EEEE, MMMM d')}`}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    
                    {dayData?.hasData && (
                      <div className="space-y-1 flex-1 overflow-hidden">
                        <div className="text-xs text-center">
                          <div 
                            className="text-blue-600 font-medium"
                            aria-hidden="true"
                          >
                            {dayData.totalCalories} cal
                          </div>
                        </div>
                        
                        {/* Display meals */}
                        {dayData.meals && dayData.meals.length > 0 && (
                          <div 
                            className="space-y-0.5 max-h-20 overflow-y-auto"
                            role="list"
                            aria-label={`Meals for ${format(date, 'EEEE, MMMM d')}`}
                          >
                            {dayData.meals.slice(0, 3).map((meal: any) => {
                              const mealLabel = `${meal.name}${meal.time ? ` at ${formatTimeForScreenReader(meal.time)}` : ''}`;
                              return (
                                <div 
                                  key={meal.id} 
                                  className="text-xs px-1 py-0.5 bg-gray-50 rounded truncate"
                                  role="listitem"
                                  aria-label={mealLabel}
                                >
                                  {meal.time && (
                                    <span className="text-gray-500 mr-1" aria-hidden="true">
                                      {meal.time.slice(0, 5)}
                                    </span>
                                  )}
                                  <span className="font-medium" aria-hidden="true">
                                    {meal.name}
                                  </span>
                                </div>
                              );
                            })}
                            {dayData.meals.length > 3 && (
                              <div 
                                className="text-xs text-gray-400 text-center"
                                aria-label={`${dayData.meals.length - 3} additional meals`}
                              >
                                <span aria-hidden="true">+{dayData.meals.length - 3} more</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div 
                          className="text-xs text-gray-400 text-center pt-1"
                          aria-hidden="true"
                        >
                          {dayData.mealCount} meals
                        </div>
                      </div>
                    )}
                    
                    {!dayData?.hasData && (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-xs text-gray-400" aria-hidden="true">
                          No meals
                        </div>
                      </div>
                    )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
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