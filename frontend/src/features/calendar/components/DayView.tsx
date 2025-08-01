import React, { useState, Suspense } from 'react';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';
import { mealsApi, MealType } from '@/features/meals/api/mealsApi';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import EditMealModal from '@/features/meals/components/EditMealModal';
import NutritionGoalsCard from '@/features/nutrition/components/NutritionGoalsCard';
import { CalendarSkeleton } from '@/components/skeletons/CalendarSkeleton';
import { MealCardSkeleton } from '@/components/skeletons/MealCardSkeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCalendarDate } from '@/utils/date';
import ErrorBoundary from '@/components/ui/error-boundary';


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
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditMealModalOpen(true);
  };

  const handleDeleteMeal = (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      deleteMealMutation.mutate(mealId);
    }
  };

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
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold break-words">
            {formatCalendarDate(date!)}
          </h1>
          <Button 
            onClick={() => setIsCreateMealModalOpen(true)}
            className="flex items-center justify-center w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Add Meal</span>
          </Button>
        </div>

        {/* Two-column layout for desktop, stacked for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column: Daily Summary and Nutrition Goals */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Daily Summary with Enhanced Visuals */}
            <Suspense fallback={<MealCardSkeleton />}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Daily Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    {MACRO_CONFIG.map((macro) => (
                      <div key={macro.key} className="text-center">
                        <div className={cn("text-lg sm:text-xl font-bold", macro.color)}>
                          {(dayData as any)[macro.key]}{macro.unit}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">{macro.label}</div>
                      </div>
                    ))}
                  </div>
              
                  {/* Additional nutrients if available */}
                  {((dayData.fiber !== undefined && dayData.fiber !== null) || 
                    (dayData.sugar !== undefined && dayData.sugar !== null) || 
                    (dayData.sodium !== undefined && dayData.sodium !== null)) && (
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4 pt-4 border-t">
                      {dayData.fiber !== undefined && (
                        <div className="text-center">
                          <div className="text-sm sm:text-lg font-semibold text-gray-700">{dayData.fiber}g</div>
                          <div className="text-xs text-gray-500">Fiber</div>
                        </div>
                      )}
                      {dayData.sugar !== undefined && (
                        <div className="text-center">
                          <div className="text-sm sm:text-lg font-semibold text-gray-700">{dayData.sugar}g</div>
                          <div className="text-xs text-gray-500">Sugar</div>
                        </div>
                      )}
                      {dayData.sodium !== undefined && (
                        <div className="text-center">
                          <div className="text-sm sm:text-lg font-semibold text-gray-700">{dayData.sodium}mg</div>
                          <div className="text-xs text-gray-500">Sodium</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Suspense>

            {/* Nutrition Goals */}
            <Suspense fallback={<MealCardSkeleton />}>
              <NutritionGoalsCard dailyNutrition={dayData} />
            </Suspense>
          </div>

          {/* Right column: Meals by Category */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {MEAL_CATEGORIES.map(category => {
              const meals = mealsByCategory[category.value] || [];
              
              return (
                <div key={category.value} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base sm:text-lg font-semibold">{category.label}</h2>
                      <Badge className={cn(category.color, "font-normal text-xs")}>
                        {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {meals.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <p className="text-gray-500 mb-4">No {category.label.toLowerCase()} meals yet</p>
                          <Button 
                            variant="outline"
                            onClick={() => handleAddMealClick(category.value)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {category.label}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Suspense fallback={<MealCardSkeleton showFoodEntries={true} />}>
                        {meals.map((meal: any) => {
                          const isExpanded = expandedMeals.has(meal.id);
                          const foodEntries = meal.foods || [];
                          
                          return (
                            <Card key={meal.id} className="overflow-hidden">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm sm:text-base mb-1 truncate">{meal.name}</CardTitle>
                                    {meal.time && (
                                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                        <span className="font-medium">{formatTime(meal.time)}</span>
                                      </div>
                                    )}
                                    {foodEntries.length > 0 && (
                                      <button
                                        onClick={() => toggleMealExpanded(meal.id)}
                                        className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center hover:text-gray-700 transition-colors"
                                      >
                                        {foodEntries.length} food{foodEntries.length !== 1 ? 's' : ''}
                                        {isExpanded ? (
                                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex space-x-1 flex-shrink-0">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditMeal(meal)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteMeal(meal.id)}
                                      disabled={deleteMealMutation.isPending}
                                      className="h-8 w-8 p-0"
                                    >
                                      {deleteMealMutation.isPending ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="pt-0">
                                {/* Macro summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                                  {MACRO_CONFIG.map((macro) => (
                                    <div key={macro.key} className="text-center">
                                      <div className={cn("font-medium text-sm sm:text-base", macro.color)}>
                                        {(meal as any)[macro.key]}{macro.unit}
                                      </div>
                                      <div className="text-xs text-gray-500">{macro.label}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Food entries (expanded) */}
                                {isExpanded && foodEntries.length > 0 && (
                                  <div className="mt-4 pt-4 border-t space-y-2">
                                    {foodEntries.map((entry: FoodEntry) => (
                                      <div key={entry.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium truncate block">{entry.food.name}</span>
                                          {entry.food.brand && (
                                            <span className="text-gray-500 text-xs truncate block">({entry.food.brand})</span>
                                          )}
                                          <span className="text-gray-500 text-xs">
                                            {entry.quantity}{entry.unit}
                                          </span>
                                        </div>
                                        <div className="text-right text-gray-600 flex-shrink-0">
                                          {Math.round(entry.calculatedCalories)} cal
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Suspense>
                    )}
                    
                    {/* Add Meal Button as Card - only show if meals exist */}
                    {meals.length > 0 && (
                      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-dashed">
                        <CardContent className="p-0">
                          <Button 
                            size="default" 
                            variant="ghost"
                            className="w-full h-auto min-h-[3rem] sm:min-h-[4rem] py-4 sm:py-6 hover:bg-gray-50"
                            onClick={() => handleAddMealClick(category.value)}
                          >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            <span className="text-sm sm:text-base">Add {category.label}</span>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
        </div>

        {/* Modals */}
        <CreateMealModal
          open={isCreateMealModalOpen}
          onOpenChange={setIsCreateMealModalOpen}
          defaultDate={date || format(new Date(), 'yyyy-MM-dd')}
          defaultType={selectedMealType}
        />

        <EditMealModal
          open={isEditMealModalOpen}
          onOpenChange={setIsEditMealModalOpen}
          meal={selectedMeal}
          currentDate={date || format(new Date(), 'yyyy-MM-dd')}
        />
      </div>
    </ErrorBoundary>
  );
};

export default DayView;