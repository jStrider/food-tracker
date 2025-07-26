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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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
        
        <Button onClick={() => {
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          setIsCreateMealModalOpen(true);
        }}>
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
              <CardContent className="p-3 h-full relative group">
                <Link to={`/day/${dateString}`} className="block h-full">
                  <div className="flex flex-col h-full">
                    <div className="text-center border-b pb-2 mb-2 relative">
                      <div className="text-xs text-gray-500 uppercase">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {format(date, 'd')}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-0 right-0 h-6 w-6 p-0 opacity-40 hover:opacity-100 transition-opacity"
                        onClick={(e) => handleAddMealClick(dateString, e)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {dayData?.hasData && (
                      <div className="space-y-1 flex-1 overflow-hidden">
                        <div className="text-xs text-center">
                          <div className="text-blue-600 font-medium">
                            {dayData.totalCalories} cal
                          </div>
                        </div>
                        
                        {/* Display meals */}
                        {dayData.meals && dayData.meals.length > 0 && (
                          <div className="space-y-0.5 max-h-20 overflow-y-auto">
                            {dayData.meals.slice(0, 3).map((meal: any) => (
                              <div key={meal.id} className="text-xs px-1 py-0.5 bg-gray-50 rounded truncate">
                                {meal.time && (
                                  <span className="text-gray-500 mr-1">{meal.time.slice(0, 5)}</span>
                                )}
                                <span className="font-medium">{meal.name}</span>
                              </div>
                            ))}
                            {dayData.meals.length > 3 && (
                              <div className="text-xs text-gray-400 text-center">
                                +{dayData.meals.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400 text-center pt-1">
                          {dayData.mealCount} meals
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
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default WeekView;