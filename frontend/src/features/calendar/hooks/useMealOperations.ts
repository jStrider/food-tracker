import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { mealsApi } from '@/features/meals/api/mealsApi';
import { format } from 'date-fns';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealModalState {
  isCreateOpen: boolean;
  isEditOpen: boolean;
  selectedMeal: any | null;
  selectedDate: string;
  selectedMealType: MealType;
}

/**
 * Hook to manage meal CRUD operations and modal states
 */
export function useMealOperations(defaultDate: string = format(new Date(), 'yyyy-MM-dd')) {
  const [modalState, setModalState] = useState<MealModalState>({
    isCreateOpen: false,
    isEditOpen: false,
    selectedMeal: null,
    selectedDate: defaultDate,
    selectedMealType: 'breakfast',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: mealsApi.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-week'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      
      toast({
        title: 'Success',
        description: 'Meal deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete meal',
        variant: 'destructive',
      });
    },
  });

  // Modal operations
  const openCreateModal = useCallback((date: string, mealType?: MealType) => {
    setModalState(prev => ({
      ...prev,
      isCreateOpen: true,
      isEditOpen: false,
      selectedDate: date,
      selectedMealType: mealType || prev.selectedMealType,
      selectedMeal: null,
    }));
  }, []);

  const openEditModal = useCallback((meal: any) => {
    setModalState(prev => ({
      ...prev,
      isCreateOpen: false,
      isEditOpen: true,
      selectedMeal: meal,
      selectedDate: meal.date || prev.selectedDate,
      selectedMealType: meal.category as MealType || prev.selectedMealType,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isCreateOpen: false,
      isEditOpen: false,
      selectedMeal: null,
    }));
  }, []);

  const deleteMeal = useCallback((mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      deleteMealMutation.mutate(mealId);
    }
  }, [deleteMealMutation]);

  const handleMealSuccess = useCallback(() => {
    closeModals();
    queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-week'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
  }, [queryClient, closeModals]);

  return {
    modalState,
    openCreateModal,
    openEditModal,
    closeModals,
    deleteMeal,
    handleMealSuccess,
    isDeleting: deleteMealMutation.isPending,
  };
}