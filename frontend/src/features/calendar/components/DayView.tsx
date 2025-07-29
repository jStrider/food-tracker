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
  AlertCircle
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCalendarDate } from '@/utils/date';


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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load daily data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!dayData) {
    return <div>No data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {formatCalendarDate(date!)}
        </h1>
        <Button 
          onClick={() => setIsCreateMealModalOpen(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Two-column layout for desktop, stacked for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Daily Summary and Nutrition Goals */}
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Summary with Enhanced Visuals */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {MACRO_CONFIG.map((macro) => (
                  <div key={macro.key} className="text-center">
                    <div className={cn("text-xl font-bold", macro.color)}>
                      {(dayData as any)[macro.key]}{macro.unit}
                    </div>
                    <div className="text-sm text-gray-500">{macro.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Additional nutrients if available */}
              {((dayData.fiber !== undefined && dayData.fiber !== null) || 
                (dayData.sugar !== undefined && dayData.sugar !== null) || 
                (dayData.sodium !== undefined && dayData.sodium !== null)) && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                  {dayData.fiber !== undefined && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">{dayData.fiber}g</div>
                      <div className="text-xs text-gray-500">Fiber</div>
                    </div>
                  )}
                  {dayData.sugar !== undefined && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">{dayData.sugar}g</div>
                      <div className="text-xs text-gray-500">Sugar</div>
                    </div>
                  )}
                  {dayData.sodium !== undefined && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">{dayData.sodium}mg</div>
                      <div className="text-xs text-gray-500">Sodium</div>
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
              <div key={category.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold">{category.label}</h2>
                    <Badge className={cn(category.color, "font-normal")}>
                      {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAddMealClick(category.value)}
                  >
                    + Add {category.label}
                  </Button>
                </div>

                <div className="space-y-3">
                    {meals.map((meal: any) => {
                      const isExpanded = expandedMeals.has(meal.id);
                      const foodEntries = meal.foods || [];
                      
                      return (
                        <Card key={meal.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <CardTitle className="text-base">{meal.name}</CardTitle>
                                  {meal.time && (
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {formatTime(meal.time)}
                                    </Badge>
                                  )}
                                </div>
                                {foodEntries.length > 0 && (
                                  <button
                                    onClick={() => toggleMealExpanded(meal.id)}
                                    className="text-sm text-gray-500 mt-1 flex items-center hover:text-gray-700 transition-colors"
                                  >
                                    {foodEntries.length} food{foodEntries.length !== 1 ? 's' : ''}
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 ml-1" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 ml-1" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditMeal(meal)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteMeal(meal.id)}
                                  disabled={deleteMealMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            {/* Macro summary */}
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              {MACRO_CONFIG.map((macro) => (
                                <div key={macro.key} className="text-center">
                                  <div className={cn("font-medium", macro.color)}>
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
                                  <div key={entry.id} className="flex items-center justify-between text-sm">
                                    <div className="flex-1">
                                      <span className="font-medium">{entry.food.name}</span>
                                      {entry.food.brand && (
                                        <span className="text-gray-500 ml-1">({entry.food.brand})</span>
                                      )}
                                      <span className="text-gray-500 ml-2">
                                        {entry.quantity}{entry.unit}
                                      </span>
                                    </div>
                                    <div className="text-right text-gray-600">
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
  );
};

export default DayView;