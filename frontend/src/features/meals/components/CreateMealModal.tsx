import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/DatePicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealsApi, MealType, CreateMealRequest } from '@/features/meals/api/mealsApi';
import { useToast } from '@/hooks/use-toast';
import { formatDate, DATE_FORMATS } from '@/utils/date';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMealTypeFromTime } from '@/utils/mealHelpers';

interface CreateMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultType?: MealType;
  defaultTime?: string;
}


const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

// Helper function to get current time in HH:MM format
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const CreateMealModal: React.FC<CreateMealModalProps> = ({
  open,
  onOpenChange,
  defaultDate = new Date().toISOString().split('T')[0],
  defaultType = 'breakfast',
  defaultTime = getCurrentTime(),
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<MealType | ''>(''); // Empty by default for auto-categorization
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultDate ? new Date(defaultDate) : new Date()
  );
  const [time, setTime] = useState<string>(defaultTime);
  const [showMealTypePreview, setShowMealTypePreview] = useState<boolean>(false);
  const [customMacros, setCustomMacros] = useState({
    calories: undefined as number | undefined,
    protein: undefined as number | undefined,
    carbs: undefined as number | undefined,
    fat: undefined as number | undefined,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update date when modal opens with new defaultDate
  useEffect(() => {
    if (open && defaultDate) {
      setSelectedDate(new Date(defaultDate));
      // Only set type if explicitly provided (from DayView's Add button)
      // Otherwise, leave empty for auto-categorization
      if (defaultType && defaultType !== 'breakfast') {
        setType(defaultType);
      } else {
        setType(''); // Let backend auto-categorize
      }
      // Auto-fill current time if no defaultTime provided
      const newTime = defaultTime || getCurrentTime();
      setTime(newTime);
      
      // Show meal type preview if auto-categorizing
      if (!type || type === '') {
        setShowMealTypePreview(true);
        // Auto-suggest meal type based on time (but don't force it)
        const suggestedType = getMealTypeFromTime(newTime);
        if (!defaultType || defaultType === 'breakfast') {
          // Only show preview, don't set the type automatically
        }
      }
      // Reset custom macros
      setCustomMacros({
        calories: undefined,
        protein: undefined,
        carbs: undefined,
        fat: undefined,
      });
    }
  }, [open, defaultDate, defaultType, defaultTime]);

  const createMealMutation = useMutation({
    mutationFn: (meal: CreateMealRequest) => mealsApi.createMeal(meal),
    onSuccess: (_, variables) => {
      // Invalidate the specific date query that DayView uses
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition', variables.date] });
      // Also invalidate the general daily-nutrition queries
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      toast({
        title: 'Success',
        description: 'Meal created successfully',
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create meal',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setName('');
    setType(defaultType);
    setTime(getCurrentTime()); // Reset to current time
    setCustomMacros({
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
    });
    onOpenChange(false);
  };

  const handleCustomMacroChange = (field: string, value: number | undefined) => {
    setCustomMacros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a meal name',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    // Format the date for API submission (YYYY-MM-DD)
    const formattedDate = formatDate(selectedDate, DATE_FORMATS.API_DATE);

    const mealData: CreateMealRequest = {
      name: name.trim(),
      ...(type && { category: type }), // Only include category if selected
      date: formattedDate,
      ...(time && { time }), // Only include time if provided
    };

    // Add custom macros if provided
    const hasCustomMacros = customMacros.calories !== undefined || 
                           customMacros.protein !== undefined || 
                           customMacros.carbs !== undefined || 
                           customMacros.fat !== undefined;
    
    if (hasCustomMacros) {
      const extendedMealData = {
        ...mealData,
        ...(customMacros.calories !== undefined && { customCalories: customMacros.calories }),
        ...(customMacros.protein !== undefined && { customProtein: customMacros.protein }),
        ...(customMacros.carbs !== undefined && { customCarbs: customMacros.carbs }),
        ...(customMacros.fat !== undefined && { customFat: customMacros.fat }),
      };
      createMealMutation.mutate(extendedMealData);
    } else {
      createMealMutation.mutate(mealData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Meal</DialogTitle>
          <DialogDescription>
            Add a new meal to your daily nutrition tracking.
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
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input
                  id="meal-name"
                  placeholder="e.g., Chicken salad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-time">Time (Optional)</Label>
                <Input
                  id="meal-time"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setTime(newTime);
                    // Update meal type preview when time changes
                    if (!type || type === '') {
                      setShowMealTypePreview(true);
                    }
                  }}
                  placeholder="HH:MM"
                />
                {showMealTypePreview && time && (!type || type === '') && (
                  <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                    <span className="text-blue-700">
                      💡 Based on time ({time}), this will be categorized as: <strong>{getMealTypeFromTime(time)}</strong>
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  If no meal type is selected, it will be auto-categorized based on time
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-type">Meal Type (Optional)</Label>
                <Select value={type} onValueChange={(value: MealType | '') => {
                  setType(value);
                  // Hide preview when user manually selects a type
                  if (value !== '') {
                    setShowMealTypePreview(false);
                  } else {
                    setShowMealTypePreview(true);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={time ? `Auto: ${getMealTypeFromTime(time)}` : "Auto-categorize based on time"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {time ? `Auto: ${getMealTypeFromTime(time)}` : "Auto-categorize based on time"}
                    </SelectItem>
                    {MEAL_TYPES.map((mealType) => (
                      <SelectItem key={mealType.value} value={mealType.value}>
                        {mealType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meal-date">Date</Label>
                <DatePicker
                  id="meal-date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="Select a date"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-600 text-sm">⚠️</span>
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">Custom Nutrition Override</p>
                    <p>These values will override calculations from individual food entries. Only fill if you know the exact nutritional content.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-calories-create">Calories</Label>
                  <Input
                    id="custom-calories-create"
                    type="number"
                    min="0"
                    step="1"
                    value={customMacros.calories || ''}
                    onChange={(e) => handleCustomMacroChange('calories', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 350"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-protein-create">Protein (g)</Label>
                  <Input
                    id="custom-protein-create"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customMacros.protein || ''}
                    onChange={(e) => handleCustomMacroChange('protein', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 25.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-carbs-create">Carbs (g)</Label>
                  <Input
                    id="custom-carbs-create"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customMacros.carbs || ''}
                    onChange={(e) => handleCustomMacroChange('carbs', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 30.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-fat-create">Fat (g)</Label>
                  <Input
                    id="custom-fat-create"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customMacros.fat || ''}
                    onChange={(e) => handleCustomMacroChange('fat', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 15.8"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMealMutation.isPending}>
              {createMealMutation.isPending ? 'Creating...' : 'Create Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMealModal;