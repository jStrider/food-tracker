import React, { useState } from 'react';
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { foodsApi, Food } from '@/features/foods/api/foodsApi';
import { mealsApi } from '@/features/meals/api/mealsApi';
import { useToast } from '@/hooks/use-toast';

interface AddFoodToMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food;
  mealId: string;
}

const UNITS = [
  { value: 'g', label: 'grams (g)' },
  { value: 'kg', label: 'kilograms (kg)' },
  { value: 'ml', label: 'milliliters (ml)' },
  { value: 'l', label: 'liters (l)' },
  { value: 'cup', label: 'cups' },
  { value: 'tbsp', label: 'tablespoons' },
  { value: 'tsp', label: 'teaspoons' },
  { value: 'piece', label: 'pieces' },
  { value: 'slice', label: 'slices' },
];

const AddFoodToMealModal: React.FC<AddFoodToMealModalProps> = ({
  open,
  onOpenChange,
  food,
  mealId,
}) => {
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meal data to get the date for proper cache invalidation
  // This ensures the NutritionGoalsCard refreshes when adding food to meals
  const { data: mealData } = useQuery({
    queryKey: ['meal', mealId],
    queryFn: () => mealsApi.getMeal(mealId),
    enabled: !!mealId && open,
  });

  const addFoodMutation = useMutation({
    mutationFn: () => foodsApi.addFoodToMeal(mealId, {
      quantity: parseFloat(quantity),
      unit,
      foodId: food.id,
    }),
    onSuccess: () => {
      // Invalidate the specific date query if we have the meal date
      if (mealData?.date) {
        queryClient.invalidateQueries({ queryKey: ['daily-nutrition', mealData.date] });
      }
      // Also invalidate general queries
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      toast({
        title: 'Success',
        description: 'Food added to meal successfully',
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add food to meal',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setQuantity('100');
    setUnit('g');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    addFoodMutation.mutate();
  };

  const calculateNutrition = (baseValue: number) => {
    const quantityNum = parseFloat(quantity) || 0;
    return Math.round((baseValue * quantityNum) / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {food.name} to Meal</DialogTitle>
          <DialogDescription>
            Specify the quantity and unit for this food item.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="unit" className="text-sm font-medium">
                Unit
              </label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unitOption) => (
                    <SelectItem key={unitOption.value} value={unitOption.value}>
                      {unitOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nutrition Preview */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Nutrition for {quantity}{unit}:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Calories: {calculateNutrition(food.calories)}</div>
              <div>Protein: {calculateNutrition(food.protein)}g</div>
              <div>Carbs: {calculateNutrition(food.carbs)}g</div>
              <div>Fat: {calculateNutrition(food.fat)}g</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addFoodMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addFoodMutation.isPending}>
              {addFoodMutation.isPending ? 'Adding...' : 'Add to Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFoodToMealModal;