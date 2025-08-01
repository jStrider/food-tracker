import React, { useRef, useState, useCallback, useEffect } from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { getDateLabel, getColorDescription } from '@/utils/accessibility';

interface DayData {
  date: string;
  hasData: boolean;
  totalCalories: number;
  mealCount: number;
  meals?: Array<{
    id: string;
    name: string;
    category: string;
    time?: string;
    calories: number;
  }>;
}

interface AccessibleCalendarGridProps {
  calendarDays: Date[];
  currentDate: Date;
  monthData?: {
    days: DayData[];
  };
  onAddMealClick: (date: string, e: React.MouseEvent) => void;
}

const AccessibleCalendarGrid: React.FC<AccessibleCalendarGridProps> = ({
  calendarDays,
  currentDate,
  monthData,
  onAddMealClick,
}) => {
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const { announce, createLiveRegion } = useAnnouncements();
  const gridRef = useRef<HTMLDivElement>(null);

  const getDayData = useCallback((date: Date): DayData | null => {
    if (!monthData?.days || monthData.days.length === 0) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return monthData.days.find(day => day.date === dateString) || null;
  }, [monthData]);

  const { containerRef } = useKeyboardNavigation({
    grid: {
      rows: Math.ceil(calendarDays.length / 7),
      cols: 7,
    },
    enableArrowKeys: true,
    enableTabNavigation: false, // We'll handle this manually for better UX
    onSelectionChange: (index) => {
      const date = calendarDays[index];
      if (date) {
        const dateString = format(date, 'yyyy-MM-dd');
        setFocusedDate(dateString);
        
        const dayData = getDayData(date);
        const label = getDateLabel(date, 'calendar', {
          hasData: dayData?.hasData,
          mealCount: dayData?.mealCount,
          totalCalories: dayData?.totalCalories,
          isSelected: true,
        });
        
        announce(label);
      }
    },
    onKeyDown: (event, currentIndex) => {
      // Handle Enter and Space to navigate to day view
      if (['Enter', ' '].includes(event.key)) {
        const date = calendarDays[currentIndex];
        if (date) {
          const dateString = format(date, 'yyyy-MM-dd');
          window.location.href = `/day/${dateString}`;
          return true; // Prevent default handling
        }
      }
      return false; // Allow default handling
    },
  });

  // Set the grid container ref
  useEffect(() => {
    if (gridRef.current && containerRef) {
      (containerRef as React.MutableRefObject<HTMLDivElement>).current = gridRef.current;
    }
  }, [containerRef]);

  const handleDateFocus = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setFocusedDate(dateString);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    announce(`Navigating to ${getDateLabel(date, 'navigation')}`, {
      priority: 'assertive',
    });
  }, [announce]);

  const getMealCategoryColor = (category: string): string => {
    switch (category) {
      case 'breakfast': return 'bg-yellow-500';
      case 'lunch': return 'bg-blue-500';
      case 'dinner': return 'bg-purple-500';
      case 'snack': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar grid instructions */}
      <div
        id="calendar-instructions"
        className="sr-only"
        aria-live="polite"
      >
        Calendar grid. Use arrow keys to navigate between dates, 
        Enter or Space to view day details, Tab to navigate to add meal buttons.
        Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}.
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {/* Day headers */}
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <div
            key={day}
            role="columnheader"
            className="text-center font-medium text-gray-500 py-2"
          >
            <span aria-label={day}>
              {day.slice(0, 3)}
            </span>
          </div>
        ))}
        
        {/* Calendar days */}
        <div
          ref={gridRef}
          role="grid"
          aria-label={`Calendar for ${format(currentDate, 'MMMM yyyy')}`}
          aria-describedby="calendar-instructions"
          className="contents"
        >
          {calendarDays.map((date, index) => {
            const dayData = getDayData(date);
            const dateString = format(date, 'yyyy-MM-dd');
            const isFocused = focusedDate === dateString;
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isToday_ = isToday(date);
            
            const dateLabel = getDateLabel(date, 'calendar', {
              hasData: dayData?.hasData,
              mealCount: dayData?.mealCount,
              totalCalories: dayData?.totalCalories,
            });

            return (
              <div
                key={dateString}
                role="gridcell"
                className={`h-24 sm:h-32 ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <Card
                  className={`h-full cursor-pointer transition-all duration-200 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 ${
                    isToday_ ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${isFocused ? 'ring-2 ring-blue-600' : ''}`}
                >
                  <CardContent className="p-2 sm:p-3 h-full relative group">
                    <Link
                      to={`/day/${dateString}`}
                      className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
                      tabIndex={index === 0 ? 0 : -1} // Only first cell is tabbable initially
                      aria-label={dateLabel}
                      onFocus={() => handleDateFocus(date)}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-1">
                          <div
                            className="text-sm font-medium text-gray-900"
                            aria-hidden="true"
                          >
                            {format(date, 'd')}
                          </div>
                        </div>
                        
                        {dayData?.hasData && (
                          <div className="space-y-0.5 flex-1 text-xs overflow-hidden">
                            <div
                              className="text-blue-600 font-medium"
                              aria-hidden="true"
                            >
                              {dayData.totalCalories} cal
                            </div>
                            
                            {/* Meal indicators with accessible descriptions */}
                            {dayData.meals && dayData.meals.length > 0 && (
                              <div className="flex flex-wrap gap-0.5">
                                {['breakfast', 'lunch', 'dinner', 'snack'].map((category) => {
                                  const mealsInCategory = dayData.meals?.filter(m => m.category === category) || [];
                                  if (mealsInCategory.length === 0) return null;
                                  
                                  const colorClass = getMealCategoryColor(category);
                                  const description = getColorDescription(category, `${mealsInCategory.length} ${category} meal${mealsInCategory.length !== 1 ? 's' : ''}`);
                                  
                                  return (
                                    <div
                                      key={category}
                                      className={`w-1.5 h-1.5 rounded-full ${colorClass}`}
                                      aria-label={description}
                                      title={description}
                                    />
                                  );
                                })}
                              </div>
                            )}
                            
                            <div className="text-gray-400 hidden sm:block" aria-hidden="true">
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

                    {/* Add meal button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:opacity-100"
                      onClick={(e) => onAddMealClick(dateString, e)}
                      aria-label={`Add meal for ${format(date, 'EEEE, MMMM d')}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live region for announcements */}
      {createLiveRegion()}
    </div>
  );
};

export default AccessibleCalendarGrid;