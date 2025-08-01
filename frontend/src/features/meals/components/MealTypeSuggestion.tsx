import React from 'react';
import { MealType } from '@/features/meals/api/mealsApi';
import { getMealTypeFromTime } from '@/utils/mealHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealTypeSuggestionProps {
  time: string;
  currentType: MealType | '';
  onAcceptSuggestion: (type: MealType) => void;
  onDismiss: () => void;
  className?: string;
}

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙', 
  snack: '🍎',
};

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: 'bg-orange-50 border-orange-200 text-orange-700',
  lunch: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  dinner: 'bg-purple-50 border-purple-200 text-purple-700',
  snack: 'bg-green-50 border-green-200 text-green-700',
};

/**
 * Smart meal type suggestion component that shows AI-powered categorization
 */
export const MealTypeSuggestion: React.FC<MealTypeSuggestionProps> = ({
  time,
  currentType,
  onAcceptSuggestion,
  onDismiss,
  className,
}) => {
  if (!time || currentType) {
    return null;
  }

  const suggestedType = getMealTypeFromTime(time);
  const icon = MEAL_TYPE_ICONS[suggestedType];
  const colorClass = MEAL_TYPE_COLORS[suggestedType];

  // Convert time to user-friendly format
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className={cn(
      "animate-in slide-in-from-top-2 duration-300",
      "border rounded-lg p-3 space-y-3",
      colorClass,
      className
    )}>
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">
            Smart Categorization
          </div>
          <div className="text-sm">
            Based on the time <Badge variant="outline" className="mx-1">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(time)}
            </Badge>, 
            we suggest categorizing this as:
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold capitalize">{suggestedType}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="default"
          onClick={() => onAcceptSuggestion(suggestedType)}
          className="h-7 text-xs"
        >
          <Check className="h-3 w-3 mr-1" />
          Use {suggestedType}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="h-7 text-xs"
        >
          Keep auto
        </Button>
      </div>
      
      <div className="text-xs opacity-75 border-t pt-2 mt-2">
        💡 You can always change this later, or select a different type manually
      </div>
    </div>
  );
};