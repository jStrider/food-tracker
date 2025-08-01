import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealsApi, MealType } from '@/features/meals/api/mealsApi';
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements } from '@/hooks/useAnnouncements';

interface UseMealManagementOptions {
  date?: string;
}

export const useMealManagement = (options: UseMealManagementOptions = {}) => {
  const { date: currentDate } = options;
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { announce, createLiveRegion } = useAnnouncements();

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: (mealId: string) => mealsApi.deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-nutrition', currentDate] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-week'] });
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
    announce(`Opening add ${type} meal dialog`);
  };

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditMealModalOpen(true);
    announce(`Opening edit dialog for ${meal.name}`);
  };

  const handleDeleteMeal = (mealId: string, mealName: string) => {
    if (window.confirm(`Are you sure you want to delete the meal "${mealName}"?`)) {
      deleteMealMutation.mutate(mealId);
      announce(`Deleting ${mealName}`);
    }
  };

  const openCreateModal = () => {
    setIsCreateMealModalOpen(true);
  };

  const openEditModal = (meal: any) => {
    setSelectedMeal(meal);
    setIsEditMealModalOpen(true);
    announce(`Opening edit dialog for ${meal.name}`);
  };

  const closeCreateModal = () => {
    setIsCreateMealModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditMealModalOpen(false);
    setSelectedMeal(null);
  };

  return {
    // State
    isCreateMealModalOpen,
    isEditMealModalOpen,
    isCreateModalOpen: isCreateMealModalOpen,
    isEditModalOpen: isEditMealModalOpen,
    selectedMeal,
    selectedMealType,
    
    // Handlers
    handleAddMealClick,
    handleEditMeal,
    handleDeleteMeal,
    openCreateModal,
    openEditModal,
    closeCreateModal,
    closeEditModal,
    
    // Mutations
    deleteMealMutation,
    isDeletingMeal: deleteMealMutation.isPending,
    
    // Utils
    createLiveRegion,
  };
};