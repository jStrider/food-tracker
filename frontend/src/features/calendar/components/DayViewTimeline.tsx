import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'lunch', label: 'Lunch', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'dinner', label: 'Dinner', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'snack', label: 'Snack', color: 'bg-green-100 text-green-800 border-green-300' },
];

// Generate hours for the timeline
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayViewTimeline: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Navigate between days
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentDate = parseISO(date!);
    const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    navigate(`/day/${format(newDate, 'yyyy-MM-dd')}`);
  };

  const handleAddMealClick = (hour: number) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedTime(time);
    
    // Determine meal type based on hour
    if (hour >= 6 && hour < 11) {
      setSelectedMealType('breakfast');
    } else if (hour >= 11 && hour < 16) {
      setSelectedMealType('lunch');
    } else if (hour >= 16 && hour < 21) {
      setSelectedMealType('dinner');
    } else {
      setSelectedMealType('snack');
    }
    
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

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  // Group meals by hour
  const mealsByHour = useMemo(() => {
    if (!dayData?.meals) return {};
    
    const grouped: Record<number, any[]> = {};
    
    dayData.meals.forEach((meal) => {
      if (meal.time) {
        const hour = parseInt(meal.time.split(':')[0]);
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(meal);
      }
    });
    
    // Sort meals within each hour by minute
    Object.keys(grouped).forEach(hour => {
      grouped[parseInt(hour)].sort((a, b) => {
        const timeA = a.time ? parseInt(a.time.split(':')[1]) : 0;
        const timeB = b.time ? parseInt(b.time.split(':')[1]) : 0;
        return timeA - timeB;
      });
    });
    
    return grouped;
  }, [dayData?.meals]);

  // Get meal category config
  const getCategoryConfig = (category: MealType) => {
    return MEAL_CATEGORIES.find(c => c.value === category) || MEAL_CATEGORIES[3]; // Default to snack
  };

  const handleAddFoodToMeal = (mealId: string) => {
    navigate(`/meals/${mealId}/foods`);
  };

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
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay('prev')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <h1 className="text-2xl font-semibold min-w-[200px] text-center">
              {formatCalendarDate(date!)}
            </h1>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay('next')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          onClick={() => {
            const now = new Date();
            const hour = now.getHours();
            handleAddMealClick(hour);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Daily Summary and Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{dayData.calories}</div>
                <div className="text-sm text-gray-500">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{dayData.protein}g</div>
                <div className="text-sm text-gray-500">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{dayData.carbs}g</div>
                <div className="text-sm text-gray-500">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{dayData.fat}g</div>
                <div className="text-sm text-gray-500">Fat</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <NutritionGoalsCard dailyNutrition={dayData} />
      </div>

      {/* Timeline View */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Daily Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="relative">
              {/* Hour rows */}
              {HOURS.map(hour => {
                const meals = mealsByHour[hour] || [];
                
                return (
                  <div key={hour} className="flex border-b last:border-b-0">
                    {/* Hour label */}
                    <div className="w-20 flex-shrink-0 p-4 text-sm text-gray-500 border-r bg-gray-50">
                      {formatHour(hour)}
                    </div>
                    
                    {/* Meals for this hour */}
                    <div className="flex-1 p-2 min-h-[80px]">
                      {meals.length === 0 ? (
                        <button
                          onClick={() => handleAddMealClick(hour)}
                          className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded-md transition-colors group"
                        >
                          <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {meals.map(meal => {
                            const isExpanded = expandedMeals.has(meal.id);
                            const foodEntries = meal.foodEntries || [];
                            const category = meal.type || (meal as any).category || 'snack';
                            const categoryConfig = getCategoryConfig(category as MealType);
                            
                            return (
                              <div
                                key={meal.id}
                                className={cn(
                                  "p-3 rounded-md border",
                                  categoryConfig.color
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium">{meal.name}</h4>
                                      {meal.time && (
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatTime(meal.time)}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                      <span>{meal.calories} cal</span>
                                      <span>P: {meal.protein}g</span>
                                      <span>C: {meal.carbs}g</span>
                                      <span>F: {meal.fat}g</span>
                                    </div>
                                    
                                    {foodEntries.length > 0 && (
                                      <button
                                        onClick={() => toggleMealExpanded(meal.id)}
                                        className="text-sm text-gray-600 mt-1 flex items-center hover:text-gray-800 transition-colors"
                                      >
                                        {foodEntries.length} food{foodEntries.length !== 1 ? 's' : ''}
                                        {isExpanded ? (
                                          <ChevronUp className="h-3 w-3 ml-1" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3 ml-1" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  
                                  <div className="flex space-x-1 ml-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditMeal(meal)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleDeleteMeal(meal.id)}
                                      disabled={deleteMealMutation.isPending}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Expanded food entries */}
                                {isExpanded && foodEntries.length > 0 && (
                                  <div className="mt-3 pt-3 border-t space-y-1">
                                    {foodEntries.map((entry: FoodEntry) => (
                                      <div key={entry.id} className="flex items-center justify-between text-sm">
                                        <div className="flex-1">
                                          <span>{entry.food.name}</span>
                                          {entry.food.brand && (
                                            <span className="text-gray-500 ml-1">({entry.food.brand})</span>
                                          )}
                                          <span className="text-gray-500 ml-2">
                                            {entry.quantity}{entry.unit}
                                          </span>
                                        </div>
                                        <div className="text-gray-600">
                                          {Math.round(entry.calculatedCalories)} cal
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full mt-2"
                                      onClick={() => handleAddFoodToMeal(meal.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Food
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Add food button when collapsed */}
                                {!isExpanded && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2"
                                    onClick={() => handleAddFoodToMeal(meal.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Food
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Add meal button at the end of existing meals */}
                          <button
                            onClick={() => handleAddMealClick(hour)}
                            className="w-full p-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Plus className="h-3 w-3 inline mr-1" />
                            Add another meal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={date || format(new Date(), 'yyyy-MM-dd')}
        defaultType={selectedMealType}
        defaultTime={selectedTime}
      />

      <EditMealModal
        open={isEditMealModalOpen}
        onOpenChange={setIsEditMealModalOpen}
        meal={selectedMeal}
      />
    </div>
  );
};

export default DayViewTimeline;