import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MACRO_CONFIG } from '@/features/calendar/constants/mealCategories';
import { getNutritionLabel } from '@/utils/accessibility';

interface DailySummaryCardProps {
  dailyNutrition: any;
  showAdditionalNutrients?: boolean;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  dailyNutrition,
  showAdditionalNutrients = true,
}) => {
  if (!dailyNutrition) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle id="daily-summary-title">Daily Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="grid grid-cols-2 gap-4"
          role="region"
          aria-labelledby="daily-summary-title"
          aria-describedby="nutrition-summary"
        >
          {MACRO_CONFIG.map((macro) => {
            const value = (dailyNutrition as any)[macro.key];
            return (
              <div 
                key={macro.key} 
                className="text-center"
                role="img"
                aria-label={`${macro.label}: ${value}${macro.unit}`}
              >
                <div className={cn("text-xl font-bold", macro.color)} aria-hidden="true">
                  {value}{macro.unit}
                </div>
                <div className="text-sm text-gray-500" aria-hidden="true">{macro.label}</div>
              </div>
            );
          })}
        </div>
        <div id="nutrition-summary" className="sr-only">
          {getNutritionLabel({
            calories: dailyNutrition.calories,
            protein: dailyNutrition.protein,
            carbs: dailyNutrition.carbs,
            fat: dailyNutrition.fat,
            fiber: dailyNutrition.fiber,
            sugar: dailyNutrition.sugar,
            sodium: dailyNutrition.sodium,
          })}
        </div>
        
        {/* Additional nutrients if available */}
        {showAdditionalNutrients && 
         ((dailyNutrition.fiber !== undefined && dailyNutrition.fiber !== null) || 
          (dailyNutrition.sugar !== undefined && dailyNutrition.sugar !== null) || 
          (dailyNutrition.sodium !== undefined && dailyNutrition.sodium !== null)) && (
          <div 
            className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t"
            role="region"
            aria-label="Additional nutrients"
          >
            {dailyNutrition.fiber !== undefined && (
              <div className="text-center" role="img" aria-label={`Fiber: ${dailyNutrition.fiber} grams`}>
                <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dailyNutrition.fiber}g</div>
                <div className="text-xs text-gray-500" aria-hidden="true">Fiber</div>
              </div>
            )}
            {dailyNutrition.sugar !== undefined && (
              <div className="text-center" role="img" aria-label={`Sugar: ${dailyNutrition.sugar} grams`}>
                <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dailyNutrition.sugar}g</div>
                <div className="text-xs text-gray-500" aria-hidden="true">Sugar</div>
              </div>
            )}
            {dailyNutrition.sodium !== undefined && (
              <div className="text-center" role="img" aria-label={`Sodium: ${dailyNutrition.sodium} milligrams`}>
                <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dailyNutrition.sodium}mg</div>
                <div className="text-xs text-gray-500" aria-hidden="true">Sodium</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySummaryCard;