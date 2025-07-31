import React, { useState, useCallback, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import { useNavigate } from 'react-router-dom';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import VirtualizedMonthGrid from './views/MonthView/VirtualizedMonthGrid';

const MonthViewVirtualized: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const navigate = useNavigate();

  const { data: monthData, isLoading, error } = useQuery({
    queryKey: ['calendar-month', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: () => calendarApi.getMonthView(currentDate.getMonth() + 1, currentDate.getFullYear()),
  });

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  }, []);

  const handleDateClick = useCallback((date: string) => {
    navigate(`/day/${date}`);
  }, [navigate]);

  const handleAddMeal = useCallback((date: string) => {
    setSelectedDate(date);
    setIsCreateMealModalOpen(true);
  }, []);

  // Transform month data for virtualized grid
  const transformedData = useMemo(() => {
    if (!monthData?.days) return [];
    return monthData.days;
  }, [monthData]);

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
        
        <Button onClick={() => {
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          setIsCreateMealModalOpen(true);
        }}>
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
            
            {/* Meal category legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Breakfast</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">Lunch</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-600">Dinner</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600">Snack</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Virtualized Month Grid */}
      <VirtualizedMonthGrid
        currentDate={currentDate}
        monthData={transformedData}
        onDateClick={handleDateClick}
        onAddMeal={handleAddMeal}
      />

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default MonthViewVirtualized;