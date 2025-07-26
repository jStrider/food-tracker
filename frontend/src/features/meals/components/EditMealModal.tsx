import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mealsApi, Meal, MealType } from '@/features/meals/api/mealsApi';

interface EditMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal | null;
}

const EditMealModal: React.FC<EditMealModalProps> = ({
  open,
  onOpenChange,
  meal
}) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    category: '' as MealType | '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when meal changes
  useEffect(() => {
    if (meal) {
      setFormData({
        name: meal.name || '',
        date: meal.date || '',
        time: meal.time || '',
        category: meal.category || '',
      });
    } else {
      setFormData({
        name: '',
        date: '',
        time: '',
        category: '',
      });
    }
  }, [meal]);

  const editMealMutation = useMutation({
    mutationFn: (data: any) => mealsApi.updateMeal(meal!.id, data),
    onSuccess: () => {
      // Invalidate the specific date query that DayView uses
      if (meal?.date) {
        queryClient.invalidateQueries({ queryKey: ['daily-nutrition', meal.date] });
        queryClient.invalidateQueries({ queryKey: ['meals-detailed', meal.date] });
      }
      // Also invalidate the general daily-nutrition queries
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
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
    
    if (!formData.name.trim() || !formData.date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    editMealMutation.mutate({
      name: formData.name.trim(),
      date: formData.date,
      time: formData.time || undefined,
      category: formData.category as MealType || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Meal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Breakfast, Lunch, Snack"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-categorized by time (optional override)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={editMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={editMealMutation.isPending}
            >
              {editMealMutation.isPending ? 'Updating...' : 'Update Meal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMealModal;