import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import { Link } from 'react-router-dom';
import CreateMealModal from '@/features/meals/components/CreateMealModal';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekData, isLoading, error } = useQuery({
    queryKey: ['calendar-week', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => calendarApi.getWeekView(format(weekStart, 'yyyy-MM-dd')),
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
    });
  };

  const getDayData = (date: Date) => {
    if (!weekData?.days) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return weekData.days.find((day: any) => day.date === dateString);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={() => setIsCreateMealModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(date => {
          const dayData = getDayData(date);
          const dateString = format(date, 'yyyy-MM-dd');
          
          return (
            <Card
              key={dateString}
              className={`h-40 cursor-pointer transition-colors hover:bg-gray-50 ${
                isToday(date) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardContent className="p-3 h-full">
                <Link to={`/day/${dateString}`} className="block h-full">
                  <div className="flex flex-col h-full">
                    <div className="text-center border-b pb-2 mb-2">
                      <div className="text-xs text-gray-500 uppercase">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {format(date, 'd')}
                      </div>
                    </div>
                    
                    {dayData?.hasData && (
                      <div className="space-y-1 flex-1">
                        <div className="text-xs text-center">
                          <div className="text-blue-600 font-medium">
                            {dayData.totalCalories} cal
                          </div>
                          <div className="text-gray-500">
                            {dayData.mealCount} meals
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                          <div>P: {dayData.totalProtein}g</div>
                          <div>C: {dayData.totalCarbs}g</div>
                          <div>F: {dayData.totalFat}g</div>
                        </div>
                      </div>
                    )}
                    
                    {!dayData?.hasData && (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-xs text-gray-400">No meals</div>
                      </div>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  );
};

export default WeekView;