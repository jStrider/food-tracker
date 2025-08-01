import React from 'react';
import { 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/features/calendar/utils/mealHelpers';
import { MACRO_CONFIG } from '@/features/calendar/constants/mealCategories';
import { getActionLabel, formatTimeForScreenReader } from '@/utils/accessibility';

interface FoodEntry {
  id: string;
  quantity: number;
  unit: string;
  food: {
    id: string;
    name: string;
    brand?: string;
  };
  calculatedCalories: number;
}

interface MealCardProps {
  meal: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const MealCard: React.FC<MealCardProps> = ({
  meal,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const foodEntries = meal.foods || [];

  return (
    <Card 
      className="overflow-hidden"
      role="article"
      aria-labelledby={`meal-${meal.id}-title`}
      aria-describedby={`meal-${meal.id}-nutrition`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle 
                className="text-base"
                id={`meal-${meal.id}-title`}
              >
                {meal.name}
              </CardTitle>
              {meal.time && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  aria-label={`Time: ${formatTimeForScreenReader(meal.time)}`}
                >
                  <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                  {formatTime(meal.time)}
                </Badge>
              )}
            </div>
            {foodEntries.length > 0 && (
              <button
                onClick={onToggleExpand}
                className="text-sm text-gray-500 mt-1 flex items-center hover:text-gray-700 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`meal-${meal.id}-details`}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} food details for ${meal.name}`}
              >
                <span aria-hidden="true">
                  {foodEntries.length} food{foodEntries.length !== 1 ? 's' : ''}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 ml-1" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
          <div className="flex space-x-1" role="group" aria-label={`Actions for ${meal.name}`}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              aria-label={getActionLabel('Edit', meal.name, 'meal')}
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={getActionLabel('Delete', meal.name, 'meal')}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Macro summary */}
        <div 
          className="grid grid-cols-4 gap-2 text-sm"
          id={`meal-${meal.id}-nutrition`}
          role="region"
          aria-label={`Nutrition for ${meal.name}`}
        >
          {MACRO_CONFIG.map((macro) => {
            const value = (meal as any)[macro.key];
            return (
              <div 
                key={macro.key} 
                className="text-center"
                role="img"
                aria-label={`${macro.label}: ${value}${macro.unit}`}
              >
                <div className={cn("font-medium", macro.color)} aria-hidden="true">
                  {value}{macro.unit}
                </div>
                <div className="text-xs text-gray-500" aria-hidden="true">{macro.label}</div>
              </div>
            );
          })}
        </div>

        {/* Food entries (expanded) */}
        {isExpanded && foodEntries.length > 0 && (
          <div 
            className="mt-4 pt-4 border-t space-y-2"
            id={`meal-${meal.id}-details`}
            role="region"
            aria-label={`Food details for ${meal.name}`}
          >
            {foodEntries.map((entry: FoodEntry) => {
              const entryLabel = `${entry.food.name}${entry.food.brand ? ` by ${entry.food.brand}` : ''}, ${entry.quantity} ${entry.unit}, ${Math.round(entry.calculatedCalories)} calories`;
              
              return (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between text-sm"
                  role="listitem"
                  aria-label={entryLabel}
                >
                  <div className="flex-1" aria-hidden="true">
                    <span className="font-medium">{entry.food.name}</span>
                    {entry.food.brand && (
                      <span className="text-gray-500 ml-1">({entry.food.brand})</span>
                    )}
                    <span className="text-gray-500 ml-2">
                      {entry.quantity}{entry.unit}
                    </span>
                  </div>
                  <div className="text-right text-gray-600" aria-hidden="true">
                    {Math.round(entry.calculatedCalories)} cal
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCard;