import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MealType } from '@/features/meals/api/mealsApi';
import MealCard from './MealCard';
import { getActionLabel } from '@/utils/accessibility';

interface MealCategorySectionProps {
  category: {
    value: MealType;
    label: string;
    color: string;
  };
  meals: any[];
  onAddMeal: (type: MealType) => void;
  onEditMeal: (meal: any) => void;
  onDeleteMeal: (mealId: string, mealName: string) => void;
  isDeletingMeal?: boolean;
}

const MealCategorySection: React.FC<MealCategorySectionProps> = ({
  category,
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  isDeletingMeal = false,
}) => {
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
  };

  if (meals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 
            className="text-lg font-semibold"
            id={`${category.value}-heading`}
          >
            {category.label}
          </h2>
          <Badge 
            className={cn(category.color, "font-normal")}
            aria-label={`${meals.length} ${category.value} meal${meals.length !== 1 ? 's' : ''}`}
          >
            {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAddMeal(category.value)}
          aria-label={getActionLabel('Add', category.label, 'meal')}
        >
          + Add {category.label}
        </Button>
      </header>

      <div 
        className="space-y-3"
        role="region"
        aria-labelledby={`${category.value}-heading`}
      >
        {meals.map((meal: any) => (
          <MealCard
            key={meal.id}
            meal={meal}
            isExpanded={expandedMeals.has(meal.id)}
            onToggleExpand={() => toggleMealExpanded(meal.id)}
            onEdit={() => onEditMeal(meal)}
            onDelete={() => onDeleteMeal(meal.id, meal.name)}
            isDeleting={isDeletingMeal}
          />
        ))}
      </div>
    </section>
  );
};

export default MealCategorySection;