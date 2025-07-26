import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import { Link } from 'react-router-dom';
import CreateMealModal from '@/features/meals/components/CreateMealModal';

const MonthView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);

  const { data: monthData, isLoading, error } = useQuery({
    queryKey: ['calendar-month', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: () => calendarApi.getMonthView(currentDate.getMonth() + 1, currentDate.getFullYear()),
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayData = (date: Date) => {
    if (!monthData?.days) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return monthData.days.find(day => day.date === dateString);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={() => setIsCreateMealModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Month Overview Stats */}
      {monthData?.summary && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{monthData.summary.totalCalories}</div>
                <div className="text-sm text-gray-500">Total Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{monthData.summary.daysWithData}</div>
                <div className="text-sm text-gray-500">Total Meals</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{monthData.summary.averageCalories}</div>
                <div className="text-sm text-gray-500">Avg Daily Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{monthData.summary.daysWithData}</div>
                <div className="text-sm text-gray-500">Days Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map(date => {
          const dayData = getDayData(date);
          const dateString = format(date, 'yyyy-MM-dd');
          
          return (
            <Card
              key={dateString}
              className={`h-24 sm:h-32 cursor-pointer transition-colors hover:bg-gray-50 ${
                isToday(date) ? 'ring-2 ring-blue-500' : ''
              } ${!isSameMonth(date, currentDate) ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-2 sm:p-3 h-full">
                <Link to={`/day/${dateString}`} className="block h-full">
                  <div className="flex flex-col h-full">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {format(date, 'd')}
                    </div>
                    
                    {dayData?.hasData && (
                      <div className="space-y-1 flex-1 text-xs">
                        <div className="text-blue-600 font-medium">
                          {dayData.totalCalories} cal
                        </div>
                        <div className="text-gray-500">
                          {dayData.mealCount} meals
                        </div>
                        
                        <div className="hidden sm:grid grid-cols-3 gap-1 text-xs text-gray-500">
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

export default MonthView;