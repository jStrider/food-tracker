import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mealsApi, Meal, MealType, UpdateMealRequest } from '@/features/meals/api/mealsApi';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatDate, DATE_FORMATS } from '@/utils/date';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface EditMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal | null;
  currentDate?: string;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const EditMealModal: React.FC<EditMealModalProps> = ({
  open,
  onOpenChange,
  meal,
  currentDate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    category: '' as MealType | '',
    notes: '',
    // Macro overrides - if not provided, will use calculated values from food entries
    customCalories: undefined as number | undefined,
    customProtein: undefined as number | undefined,
    customCarbs: undefined as number | undefined,
    customFat: undefined as number | undefined,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when meal changes
  useEffect(() => {
    if (meal) {
      setFormData({
        name: meal.name || '',
        date: meal.date || currentDate || '',
        time: meal.time || '',
        category: (meal.type || (meal as any).category || '') as MealType | '',
        notes: '',
        customCalories: (meal as any).customCalories || undefined,
        customProtein: (meal as any).customProtein || undefined,
        customCarbs: (meal as any).customCarbs || undefined,
        customFat: (meal as any).customFat || undefined,
      });
      setSelectedDate(meal.date ? new Date(meal.date) : (currentDate ? new Date(currentDate) : undefined));
    } else {
      setFormData({
        name: '',
        date: '',
        time: '',
        category: '',
        notes: '',
        customCalories: undefined,
        customProtein: undefined,
        customCarbs: undefined,
        customFat: undefined,
      });
      setSelectedDate(undefined);
    }
  }, [meal, currentDate]);

  const editMealMutation = useMutation({
    mutationFn: (data: UpdateMealRequest) => mealsApi.updateMeal(meal!.id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific date query that DayView uses
      if (variables.date || meal?.date) {
        const dateToInvalidate = variables.date || meal!.date;
        queryClient.invalidateQueries({ queryKey: ['daily-nutrition', dateToInvalidate] });
      }
      // Also invalidate the general daily-nutrition queries
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      toast({
        title: 'Success',
        description: 'Meal updated successfully',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update meal',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a meal name',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    // Format the date for API submission (YYYY-MM-DD)
    const formattedDate = formatDate(selectedDate, DATE_FORMATS.API_DATE);

    const updateData: UpdateMealRequest = {
      name: formData.name.trim(),
      date: formattedDate,
      ...(formData.time && { time: formData.time }),
      ...(formData.category && { category: formData.category }),
    };

    // Add custom macros if provided
    const hasCustomMacros = formData.customCalories !== undefined || 
                           formData.customProtein !== undefined || 
                           formData.customCarbs !== undefined || 
                           formData.customFat !== undefined;
    
    if (hasCustomMacros) {
      const extendedUpdateData = {
        ...updateData,
        ...(formData.customCalories !== undefined && { customCalories: formData.customCalories }),
        ...(formData.customProtein !== undefined && { customProtein: formData.customProtein }),
        ...(formData.customCarbs !== undefined && { customCarbs: formData.customCarbs }),
        ...(formData.customFat !== undefined && { customFat: formData.customFat }),
      };
      editMealMutation.mutate(extendedUpdateData);
    } else {
      editMealMutation.mutate(updateData);
    }
  };

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Meal</DialogTitle>
          <DialogDescription>
            Update meal details and optionally override calculated macros.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition (Optional)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meal-name-edit">Meal Name</Label>
                <Input
                  id="meal-name-edit"
                  placeholder="e.g., Chicken salad"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-time-edit">Time (Optional)</Label>
                <Input
                  id="meal-time-edit"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  placeholder="HH:MM"
                />
                <p className="text-xs text-gray-500">
                  If no meal type is selected, it will be auto-categorized based on time
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-type-edit">Meal Type (Optional)</Label>
                <Select value={formData.category} onValueChange={(value: MealType | '') => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-categorize based on time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-categorize based on time</SelectItem>
                    {MEAL_TYPES.map((mealType) => (
                      <SelectItem key={mealType.value} value={mealType.value}>
                        {mealType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-date-edit">Date</Label>
                <DatePicker
                  id="meal-date-edit"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Select a date"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4">
              {meal && (
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <p className="font-medium mb-2">Current calculated values:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <span>Calories: {meal.calories}</span>
                    <span>Protein: {meal.protein}g</span>
                    <span>Carbs: {meal.carbs}g</span>
                    <span>Fat: {meal.fat}g</span>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Override calculated nutritional values with custom values. Leave blank to keep calculated values from food entries.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-calories-edit">Calories</Label>
                  <Input
                    id="custom-calories-edit"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.customCalories || ''}
                    onChange={(e) => handleChange('customCalories', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 350"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-protein-edit">Protein (g)</Label>
                  <Input
                    id="custom-protein-edit"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.customProtein || ''}
                    onChange={(e) => handleChange('customProtein', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 25.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-carbs-edit">Carbs (g)</Label>
                  <Input
                    id="custom-carbs-edit"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.customCarbs || ''}
                    onChange={(e) => handleChange('customCarbs', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 30.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-fat-edit">Fat (g)</Label>
                  <Input
                    id="custom-fat-edit"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.customFat || ''}
                    onChange={(e) => handleChange('customFat', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 15.8"
                  />
                </div>
              </div>
              <p className="text-xs text-yellow-600">
                ⚠️ Custom values will override calculations from food entries
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={editMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editMealMutation.isPending}>
              {editMealMutation.isPending ? 'Updating...' : 'Update Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMealModal;