import React, { memo } from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayData {
  date: string;
  hasData: boolean;
  totalCalories: number;
  mealCount: number;
  meals?: Array<{
    id: string;
    category: string;
    name: string;
  }>;
}

interface DayCellProps {
  date: Date;
  dayData?: DayData | null;
  onDayClick: () => void;
  onAddMealClick: () => void;
}

const DayCell: React.FC<DayCellProps> = memo(({ 
  date, 
  dayData, 
  onDayClick, 
  onAddMealClick 
}) => {
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddMealClick();
  };

  const mealCategories = {
    breakfast: 'bg-yellow-500',
    lunch: 'bg-blue-500',
    dinner: 'bg-purple-500',
    snack: 'bg-green-500',
  };

  return (
    <div
      onClick={onDayClick}
      className={cn(
        "h-full p-2 sm:p-3 cursor-pointer transition-colors hover:bg-gray-50 border relative group",
        isToday(date) && "ring-2 ring-blue-500",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-1">
          <div className="text-sm font-medium text-gray-900">
            {format(date, 'd')}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-40 hover:opacity-100 transition-opacity"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {dayData?.hasData ? (
          <div className="space-y-0.5 flex-1 text-xs overflow-hidden">
            <div className="text-blue-600 font-medium">
              {dayData.totalCalories} cal
            </div>
            
            {/* Meal indicators */}
            {dayData.meals && dayData.meals.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {Object.entries(mealCategories).map(([category, colorClass]) => {
                  const mealsInCategory = dayData.meals?.filter(m => m.category === category) || [];
                  if (mealsInCategory.length === 0) return null;
                  
                  return (
                    <div
                      key={category}
                      className={cn("w-1.5 h-1.5 rounded-full", colorClass)}
                      title={`${category}: ${mealsInCategory.length}`}
                    />
                  );
                })}
              </div>
            )}
            
            <div className="text-gray-400 hidden sm:block">
              {dayData.mealCount} meals
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xs text-gray-400">No meals</div>
          </div>
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

export default DayCell;