import React, { memo } from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDay } from '@/features/calendar/api/calendarApi';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DayCellProps {
  date: Date;
  dayData: CalendarDay | null;
  isCurrentMonth: boolean;
  onSelect: () => void;
}

const MEAL_COLORS = {
  breakfast: 'bg-yellow-500',
  lunch: 'bg-blue-500',
  dinner: 'bg-purple-500',
  snack: 'bg-green-500'
};

export const DayCell: React.FC<DayCellProps> = memo(({
  date,
  dayData,
  isCurrentMonth,
  onSelect
}) => {
  const navigate = useNavigate();
  const dateString = format(date, 'yyyy-MM-dd');
  const dayNumber = format(date, 'd');
  const isCurrentDay = isToday(date);

  const handleDayClick = () => {
    // Navigate to day view
    navigate(`/day/${dateString}`);
  };

  const handleAddMealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <Card
      className={cn(
        'h-24 sm:h-32 cursor-pointer transition-all hover:shadow-md group',
        isCurrentDay && 'ring-2 ring-blue-500 ring-offset-2',
        !isCurrentMonth && 'opacity-40 hover:opacity-60'
      )}
      onClick={handleDayClick}
      role="button"
      tabIndex={0}
      aria-label={`${format(date, 'MMMM d, yyyy')}${dayData?.hasData ? `, ${dayData.totalCalories} calories, ${dayData.mealCount} meals` : ', no meals'}`}
    >
      <CardContent className="p-2 sm:p-3 h-full relative">
        <div className="flex flex-col h-full">
          {/* Day header */}
          <div className="flex justify-between items-start mb-1">
            <span 
              className={cn(
                'text-sm font-medium',
                isCurrentDay ? 'text-blue-600' : 'text-gray-900',
                !isCurrentMonth && 'text-gray-400'
              )}
            >
              {dayNumber}
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddMealClick}
              aria-label={`Add meal for ${format(date, 'MMMM d')}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Day content */}
          {dayData?.hasData ? (
            <div className="space-y-1 flex-1 overflow-hidden">
              {/* Calorie count */}
              <div className="text-xs sm:text-sm font-medium text-blue-600">
                {dayData.totalCalories} cal
              </div>
              
              {/* Meal indicators */}
              {dayData.meals && dayData.meals.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
                    const mealsInCategory = dayData.meals?.filter(m => m.category === category) || [];
                    if (mealsInCategory.length === 0) return null;
                    
                    return (
                      <div
                        key={category}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          MEAL_COLORS[category as keyof typeof MEAL_COLORS]
                        )}
                        title={`${category}: ${mealsInCategory.length} meal${mealsInCategory.length > 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Meal count */}
              <div className="text-xs text-gray-500 hidden sm:block">
                {dayData.mealCount} {dayData.mealCount === 1 ? 'meal' : 'meals'}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-gray-400">
                No meals
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

DayCell.displayName = 'DayCell';

export default DayCell;
