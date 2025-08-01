import React, { memo, useMemo, useCallback } from 'react';
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
  
  // Memoize date calculations
  const dateInfo = useMemo(() => ({
    dateString: format(date, 'yyyy-MM-dd'),
    dayNumber: format(date, 'd'),
    isCurrentDay: isToday(date),
    ariaLabel: format(date, 'MMMM d, yyyy'),
    monthDay: format(date, 'MMMM d')
  }), [date]);

  // Memoize callbacks
  const handleDayClick = useCallback(() => {
    navigate(`/day/${dateInfo.dateString}`);
  }, [navigate, dateInfo.dateString]);

  const handleAddMealClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  // Memoize class names
  const cardClassName = useMemo(() => cn(
    'h-20 sm:h-24 lg:h-32 cursor-pointer transition-all hover:shadow-md group',
    dateInfo.isCurrentDay && 'ring-1 sm:ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2',
    !isCurrentMonth && 'opacity-40 hover:opacity-60'
  ), [dateInfo.isCurrentDay, isCurrentMonth]);

  const dayNumberClassName = useMemo(() => cn(
    'text-sm font-medium',
    dateInfo.isCurrentDay ? 'text-blue-600' : 'text-gray-900',
    !isCurrentMonth && 'text-gray-400'
  ), [dateInfo.isCurrentDay, isCurrentMonth]);

  return (
    <Card
      className={cardClassName}
      onClick={handleDayClick}
      role="button"
      tabIndex={0}
      aria-label={`${dateInfo.ariaLabel}${dayData?.hasData ? `, ${dayData.totalCalories} calories, ${dayData.mealCount} meals` : ', no meals'}`}
    >
      <CardContent className="p-2 sm:p-3 h-full relative">
        <div className="flex flex-col h-full">
          {/* Day header */}
          <div className="flex justify-between items-start mb-1">
            <span className={dayNumberClassName}>
              {dateInfo.dayNumber}
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddMealClick}
              aria-label={`Add meal for ${dateInfo.monthDay}`}
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
                <MealIndicators meals={dayData.meals} />
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

// Separate component for meal indicators to optimize re-renders
const MealIndicators: React.FC<{ meals: CalendarDay['meals'] }> = memo(({ meals }) => {
  const indicators = useMemo(() => {
    return ['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
      const mealsInCategory = meals?.filter(m => m.category === category) || [];
      if (mealsInCategory.length === 0) return null;
      
      return {
        category,
        count: mealsInCategory.length,
        color: MEAL_COLORS[category as keyof typeof MEAL_COLORS],
        title: `${category}: ${mealsInCategory.length} meal${mealsInCategory.length > 1 ? 's' : ''}`
      };
    }).filter(Boolean);
  }, [meals]);

  return (
    <div className="flex flex-wrap gap-1">
      {indicators.map((indicator) => indicator && (
        <div
          key={indicator.category}
          className={cn('w-2 h-2 rounded-full', indicator.color)}
          title={indicator.title}
        />
      ))}
    </div>
  );
});

MealIndicators.displayName = 'MealIndicators';

export default DayCell;