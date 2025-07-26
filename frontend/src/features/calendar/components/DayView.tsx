import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';
import { mealsApi } from '@/features/meals/api/mealsApi';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import EditMealModal from '@/features/meals/components/EditMealModal';
// import AddFoodToMealModal from '@/features/foods/components/AddFoodToMealModal';
import NutritionGoalsCard from '@/features/nutrition/components/NutritionGoalsCard';
import { useToast } from '@/hooks/use-toast';
import { formatCalendarDate } from '@/utils/date';
// import { foodsApi, Food } from '@/features/foods/api/foodsApi';

const DayView: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  // const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  // const [selectedMealId, setSelectedMealId] = useState<string>('');
  // const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  // const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dayData, isLoading } = useQuery({
    queryKey: ['daily-nutrition', date],
    queryFn: () => nutritionApi.getDailyNutrition(date!),
    enabled: !!date,
  });

  // const { data: foodSearchResults } = useQuery({
  //   queryKey: ['food-search', foodSearchQuery],
  //   queryFn: () => foodsApi.searchFoods(foodSearchQuery),
  //   enabled: foodSearchQuery.length > 2,
  // });

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

  const handleAddFoodToMeal = (_mealId: string) => {
    // setSelectedMealId(mealId);
    navigate('/foods');
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditMealModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dayData) {
    return <div>No data found</div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Calendar
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            {formatCalendarDate(date!)}
          </h1>
        </div>
        
        <Button onClick={() => setIsCreateMealModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dayData.calories}</div>
              <div className="text-sm text-gray-500">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dayData.protein}g</div>
              <div className="text-sm text-gray-500">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dayData.carbs}g</div>
              <div className="text-sm text-gray-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dayData.fat}g</div>
              <div className="text-sm text-gray-500">Fat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <NutritionGoalsCard dailyNutrition={dayData} />

      {/* Meals */}
      <div className="space-y-4">
        {dayData.meals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">No meals recorded for this day</div>
              <Button className="mt-4" onClick={() => setIsCreateMealModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Meal
              </Button>
            </CardContent>
          </Card>
        ) : (
          dayData.meals.map((meal) => (
            <Card key={meal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="capitalize">{meal.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditMeal(meal)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMealMutation.mutate(meal.id)}
                    disabled={deleteMealMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{meal.calories}</div>
                    <div className="text-gray-500">Calories</div>
                  </div>
                  <div>
                    <div className="font-medium">{meal.protein}g</div>
                    <div className="text-gray-500">Protein</div>
                  </div>
                  <div>
                    <div className="font-medium">{meal.carbs}g</div>
                    <div className="text-gray-500">Carbs</div>
                  </div>
                  <div>
                    <div className="font-medium">{meal.fat}g</div>
                    <div className="text-gray-500">Fat</div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => handleAddFoodToMeal(meal.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={date || format(new Date(), 'yyyy-MM-dd')}
      />

      <EditMealModal
        open={isEditMealModalOpen}
        onOpenChange={setIsEditMealModalOpen}
        meal={selectedMeal}
      />
    </div>
  );
};

export default DayView;