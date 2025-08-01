import React from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { getDateLabel, formatTimeForScreenReader } from '@/utils/accessibility';

interface WeekDayCardProps {
  date: Date;
  dayData: any;
  onAddMeal: (date: string, e: React.MouseEvent) => void;
  tabIndex: number;
  onNavigate: () => void;
}

const WeekDayCard: React.FC<WeekDayCardProps> = ({ 
  date, 
  dayData, 
  onAddMeal, 
  tabIndex,
  onNavigate
}) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dayLabel = getDateLabel(date, 'calendar', {
    hasData: dayData?.hasData,
    mealCount: dayData?.mealCount,
    totalCalories: dayData?.totalCalories,
  });

  return (
    <div
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
            tabIndex={tabIndex}
            onClick={onNavigate}
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
                  onClick={(e) => onAddMeal(dateString, e)}
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
};

export default WeekDayCard;