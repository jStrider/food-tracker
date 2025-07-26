import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mealsApi } from '@/features/meals/api/mealsApi';

interface Meal {
  id: string;
  name: string;
  date: string;
  time: string;
  category: string;
  description?: string;
}

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
    category: '',
    description: ''
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
        description: meal.description || ''
      });
    } else {
      setFormData({
        name: '',
        date: '',
        time: '',
        category: '',
        description: ''
      });
    }
  }, [meal]);

  const editMealMutation = useMutation({
    mutationFn: (data: any) => mealsApi.updateMeal(meal!.id, data),
    onSuccess: () => {
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
    
    if (!formData.name.trim() || !formData.date || !formData.time) {
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
      time: formData.time,
      category: formData.category || undefined,
      description: formData.description.trim() || undefined,
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
                Time *
              </label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                required
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

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description"
            />
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