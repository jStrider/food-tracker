import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';
import { mealsApi, MealType } from '@/features/meals/api/mealsApi';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import EditMealModal from '@/features/meals/components/EditMealModal';
import NutritionGoalsCard from '@/features/nutrition/components/NutritionGoalsCard';
import { CalendarSkeleton } from '@/components/skeletons/CalendarSkeleton';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCalendarDate } from '@/utils/date';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { getNutritionLabel, getActionLabel, formatTimeForScreenReader } from '@/utils/accessibility';


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

// Meal category configuration
const MEAL_CATEGORIES: { value: MealType; label: string; color: string }[] = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-blue-100 text-blue-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-purple-100 text-purple-800' },
  { value: 'snack', label: 'Snack', color: 'bg-green-100 text-green-800' },
];

// Macro configuration
const MACRO_CONFIG = [
  { key: 'calories', label: 'Calories', unit: '', color: 'text-blue-600' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'text-green-600' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-orange-600' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'text-purple-600' },
];

const DayView: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { announce, createLiveRegion } = useAnnouncements();
  
  // Focus management for modals
  const { containerRef: createModalRef } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
  });
  
  const { containerRef: editModalRef } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
  });

  // Fetch daily nutrition data
  const { data: dayData, isLoading, error } = useQuery({
    queryKey: ['daily-nutrition', date],
    queryFn: () => nutritionApi.getDailyNutrition(date!),
    enabled: !!date,
  });

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: (mealId: string) => mealsApi.deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition', date] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      toast({
        title: 'Success',
        description: 'Meal deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive',
      });
    },
  });

  const handleAddMealClick = (type: MealType) => {
    setSelectedMealType(type);
    setIsCreateMealModalOpen(true);
    announce(`Opening add ${type} meal dialog`);
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditMealModalOpen(true);
    announce(`Opening edit dialog for ${meal.name}`);
  };

  const handleDeleteMeal = (mealId: string, mealName: string) => {
    if (window.confirm(`Are you sure you want to delete the meal "${mealName}"?`)) {
      deleteMealMutation.mutate(mealId);
      announce(`Deleting ${mealName}`);
    }
  };

  const toggleMealExpanded = (mealId: string, mealName: string) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(mealId);
      if (wasExpanded) {
        newSet.delete(mealId);
        announce(`Collapsed ${mealName} details`);
      } else {
        newSet.add(mealId);
        announce(`Expanded ${mealName} details`);
      }
      return newSet;
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group meals by category
  const mealsByCategory = React.useMemo(() => {
    const defaultCategories: Record<MealType, any[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    if (!dayData?.meals) return defaultCategories;
    
    return dayData.meals.reduce((acc, meal) => {
      // Use type for backward compatibility, fall back to category
      const category = ((meal as any).type || meal.category || 'snack') as MealType;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(meal);
      return acc;
    }, defaultCategories);
  }, [dayData?.meals]);

  if (isLoading) {
    return <CalendarSkeleton viewType="day" />;
  }

  if (error) {
    return (
      <ErrorBoundary
        fallbackComponent={
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>Failed to load daily data. Please try again.</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </AlertDescription>
          </Alert>
        }
      >
        <div>Error occurred</div>
      </ErrorBoundary>
    );
  }

  if (!dayData) {
    return <div>No data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 
          className="text-2xl font-semibold"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatCalendarDate(date!)}
        </h1>
        <Button 
          onClick={() => {
            setIsCreateMealModalOpen(true);
            announce('Opening add meal dialog');
          }}
          className="flex items-center"
          aria-describedby="add-meal-description"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Meal
        </Button>
        <div id="add-meal-description" className="sr-only">
          Add a new meal for {formatCalendarDate(date!)}
        </div>
      </header>

      {/* Two-column layout for desktop, stacked for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Daily Summary and Nutrition Goals */}
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Summary with Enhanced Visuals */}
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
                  const value = (dayData as any)[macro.key];
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
                  calories: dayData.calories,
                  protein: dayData.protein,
                  carbs: dayData.carbs,
                  fat: dayData.fat,
                  fiber: dayData.fiber,
                  sugar: dayData.sugar,
                  sodium: dayData.sodium,
                })}
              </div>
              
              {/* Additional nutrients if available */}
              {((dayData.fiber !== undefined && dayData.fiber !== null) || 
                (dayData.sugar !== undefined && dayData.sugar !== null) || 
                (dayData.sodium !== undefined && dayData.sodium !== null)) && (
                <div 
                  className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t"
                  role="region"
                  aria-label="Additional nutrients"
                >
                  {dayData.fiber !== undefined && (
                    <div className="text-center" role="img" aria-label={`Fiber: ${dayData.fiber} grams`}>
                      <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dayData.fiber}g</div>
                      <div className="text-xs text-gray-500" aria-hidden="true">Fiber</div>
                    </div>
                  )}
                  {dayData.sugar !== undefined && (
                    <div className="text-center" role="img" aria-label={`Sugar: ${dayData.sugar} grams`}>
                      <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dayData.sugar}g</div>
                      <div className="text-xs text-gray-500" aria-hidden="true">Sugar</div>
                    </div>
                  )}
                  {dayData.sodium !== undefined && (
                    <div className="text-center" role="img" aria-label={`Sodium: ${dayData.sodium} milligrams`}>
                      <div className="text-lg font-semibold text-gray-700" aria-hidden="true">{dayData.sodium}mg</div>
                      <div className="text-xs text-gray-500" aria-hidden="true">Sodium</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Goals */}
          <NutritionGoalsCard dailyNutrition={dayData} />
        </div>

        {/* Right column: Meals by Category */}
        <div className="lg:col-span-2 space-y-6">
          {MEAL_CATEGORIES.map(category => {
            const meals = mealsByCategory[category.value] || [];
            
            // Skip empty categories
            if (meals.length === 0) {
              return null;
            }
            
            return (
              <section key={category.value} className="space-y-3">
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
                    onClick={() => handleAddMealClick(category.value)}
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
                    {meals.map((meal: any) => {
                      const isExpanded = expandedMeals.has(meal.id);
                      const foodEntries = meal.foods || [];
                      
                      return (
                        <Card 
                          key={meal.id} 
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
                                    onClick={() => toggleMealExpanded(meal.id, meal.name)}
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
                                  onClick={() => handleEditMeal(meal)}
                                  aria-label={getActionLabel('Edit', meal.name, 'meal')}
                                >
                                  <Edit className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteMeal(meal.id, meal.name)}
                                  disabled={deleteMealMutation.isPending}
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
                    })}
                </div>
              </section>
            );
          })}
        </div>
        </div>

      {/* Modals */}
      <div ref={createModalRef as React.RefObject<HTMLDivElement>}>
        <CreateMealModal
          open={isCreateMealModalOpen}
          onOpenChange={setIsCreateMealModalOpen}
          defaultDate={date || format(new Date(), 'yyyy-MM-dd')}
          defaultType={selectedMealType}
        />
      </div>

      <div ref={editModalRef as React.RefObject<HTMLDivElement>}>
        <EditMealModal
          open={isEditMealModalOpen}
          onOpenChange={setIsEditMealModalOpen}
          meal={selectedMeal}
          currentDate={date || format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {/* Live region for announcements */}
      {createLiveRegion()}
    </div>
  );
};

export default DayView;