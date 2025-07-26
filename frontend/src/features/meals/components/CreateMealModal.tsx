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
import { formatDate, toAPIDate } from '@/utils/date';

interface CreateMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultType?: MealType;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const CreateMealModal: React.FC<CreateMealModalProps> = ({
  open,
  onOpenChange,
  defaultDate = new Date().toISOString().split('T')[0],
  defaultType = 'breakfast',
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>(defaultType);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultDate ? new Date(defaultDate) : new Date()
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update date when modal opens with new defaultDate
  useEffect(() => {
    if (open && defaultDate) {
      setSelectedDate(new Date(defaultDate));
    }
  }, [open, defaultDate]);

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
    onOpenChange(false);
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
    const formattedDate = formatDate(selectedDate, 'yyyy-MM-dd');

    createMealMutation.mutate({
      name: name.trim(),
      type,
      date: formattedDate,
    });
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
          <div className="space-y-2">
            <label htmlFor="meal-name" className="text-sm font-medium">
              Meal Name
            </label>
            <Input
              id="meal-name"
              placeholder="e.g., Chicken salad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meal-type" className="text-sm font-medium">
              Meal Type
            </label>
            <Select value={type} onValueChange={(value: MealType) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((mealType) => (
                  <SelectItem key={mealType.value} value={mealType.value}>
                    {mealType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="meal-date" className="text-sm font-medium">
              Date
            </label>
            <DatePicker
              id="meal-date"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select a date"
              displayFormat="PPP"
            />
          </div>

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