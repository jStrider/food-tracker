import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
// import { Link } from 'react-router-dom';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import AccessibleCalendarGrid from './AccessibleCalendarGrid';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { getNavigationLabel } from '@/utils/accessibility';

const MonthView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { announce } = useAnnouncements();

  const { data: monthData, isLoading, error } = useQuery({
    queryKey: ['calendar-month', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: () => calendarApi.getMonthView(currentDate.getMonth() + 1, currentDate.getFullYear()),
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
      const label = getNavigationLabel(
        direction === 'prev' ? 'previous' : 'next',
        'month',
        newDate
      );
      announce(label);
      return newDate;
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // const getDayData = (date: Date) => {
  //   if (!monthData?.days || monthData.days.length === 0) return null;
  //   const dateString = format(date, 'yyyy-MM-dd');
  //   return monthData.days.find(day => day.date === dateString);
  // };

  const handleAddMealClick = (date: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event bubbling
    setSelectedDate(date);
    setIsCreateMealModalOpen(true);
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
          <h2 className="text-lg font-semibold mb-2">Failed to load calendar</h2>
          <p>Please try refreshing the page. If the problem persists, check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4" role="group" aria-label="Calendar navigation">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            aria-label={getNavigationLabel('previous', 'month', subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 
            className="text-2xl font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            aria-label={getNavigationLabel('next', 'month', addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        
        <Button 
          onClick={() => {
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
            setIsCreateMealModalOpen(true);
            announce('Opening add meal dialog');
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

      {/* Month Overview Stats */}
      {monthData?.summary && (
        <Card>
          <CardContent className="p-4">
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
              role="region"
              aria-label="Monthly nutrition summary"
            >
              <div role="img" aria-label={`Total calories: ${monthData.summary.totalCalories}`}>
                <div className="text-lg font-bold text-blue-600" aria-hidden="true">
                  {monthData.summary.totalCalories}
                </div>
                <div className="text-sm text-gray-500" aria-hidden="true">Total Calories</div>
              </div>
              <div role="img" aria-label={`Total meals: ${monthData.summary.daysWithData}`}>
                <div className="text-lg font-bold text-green-600" aria-hidden="true">
                  {monthData.summary.daysWithData}
                </div>
                <div className="text-sm text-gray-500" aria-hidden="true">Total Meals</div>
              </div>
              <div role="img" aria-label={`Average daily calories: ${monthData.summary.averageCalories}`}>
                <div className="text-lg font-bold text-orange-600" aria-hidden="true">
                  {monthData.summary.averageCalories}
                </div>
                <div className="text-sm text-gray-500" aria-hidden="true">Avg Daily Calories</div>
              </div>
              <div role="img" aria-label={`Days tracked: ${monthData.summary.daysWithData}`}>
                <div className="text-lg font-bold text-purple-600" aria-hidden="true">
                  {monthData.summary.daysWithData}
                </div>
                <div className="text-sm text-gray-500" aria-hidden="true">Days Tracked</div>
              </div>
            </div>
            
            {/* Meal category legend */}
            <div 
              className="flex items-center justify-center gap-4 mt-4 pt-4 border-t"
              role="region"
              aria-label="Meal category color legend"
            >
              <div className="flex items-center gap-1 text-xs" role="img" aria-label="Yellow indicates breakfast meals">
                <div className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
                <span className="text-gray-600">Breakfast</span>
              </div>
              <div className="flex items-center gap-1 text-xs" role="img" aria-label="Blue indicates lunch meals">
                <div className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
                <span className="text-gray-600">Lunch</span>
              </div>
              <div className="flex items-center gap-1 text-xs" role="img" aria-label="Purple indicates dinner meals">
                <div className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true" />
                <span className="text-gray-600">Dinner</span>
              </div>
              <div className="flex items-center gap-1 text-xs" role="img" aria-label="Green indicates snack meals">
                <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                <span className="text-gray-600">Snack</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AccessibleCalendarGrid
        calendarDays={calendarDays}
        currentDate={currentDate}
        monthData={monthData}
        onAddMealClick={handleAddMealClick}
      />

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default MonthView;