import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useMealOperations } from '../useMealOperations';
import { mealsApi } from '@/features/meals/api/mealsApi';

vi.mock('@/features/meals/api/mealsApi');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock window.confirm
global.confirm = vi.fn(() => true);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMealOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });

    expect(result.current.modalState).toEqual({
      isCreateOpen: false,
      isEditOpen: false,
      selectedMeal: null,
      selectedDate: expect.any(String),
      selectedMealType: 'breakfast',
    });
    expect(result.current.isDeleting).toBe(false);
  });

  it('should initialize with custom date', () => {
    const customDate = '2024-03-20';
    const { result } = renderHook(() => useMealOperations(customDate), { wrapper: createWrapper() });

    expect(result.current.modalState.selectedDate).toBe(customDate);
  });

  describe('modal operations', () => {
    it('should open create modal with date and meal type', () => {
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });

      act(() => {
        result.current.openCreateModal('2024-01-15', 'lunch');
      });

      expect(result.current.modalState).toMatchObject({
        isCreateOpen: true,
        isEditOpen: false,
        selectedDate: '2024-01-15',
        selectedMealType: 'lunch',
        selectedMeal: null,
      });
    });

    it('should open create modal with default meal type', () => {
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });

      act(() => {
        result.current.openCreateModal('2024-01-15');
      });

      expect(result.current.modalState.selectedMealType).toBe('breakfast');
    });

    it('should open edit modal with meal data', () => {
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });
      const mockMeal = {
        id: '1',
        name: 'Test Meal',
        date: '2024-01-15',
        category: 'dinner',
      };

      act(() => {
        result.current.openEditModal(mockMeal);
      });

      expect(result.current.modalState).toMatchObject({
        isCreateOpen: false,
        isEditOpen: true,
        selectedMeal: mockMeal,
        selectedDate: '2024-01-15',
        selectedMealType: 'dinner',
      });
    });

    it('should close all modals', () => {
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });

      // First open a modal
      act(() => {
        result.current.openCreateModal('2024-01-15', 'lunch');
      });

      // Then close it
      act(() => {
        result.current.closeModals();
      });

      expect(result.current.modalState).toMatchObject({
        isCreateOpen: false,
        isEditOpen: false,
        selectedMeal: null,
      });
    });
  });

  describe('deleteMeal', () => {
    it('should delete meal after confirmation', async () => {
      global.confirm = vi.fn(() => true);
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });
      vi.mocked(mealsApi.deleteMeal).mockResolvedValueOnce(undefined);

      await act(async () => {
        result.current.deleteMeal('meal-123');
      });

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this meal?');
      expect(mealsApi.deleteMeal).toHaveBeenCalledWith('meal-123');

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });

    it('should not delete meal if user cancels', () => {
      global.confirm = vi.fn(() => false);
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });

      act(() => {
        result.current.deleteMeal('meal-123');
      });

      expect(mealsApi.deleteMeal).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      global.confirm = vi.fn(() => true);
      const { result } = renderHook(() => useMealOperations(), { wrapper: createWrapper() });
      const error = { response: { data: { message: 'Delete failed' } } };
      vi.mocked(mealsApi.deleteMeal).mockRejectedValueOnce(error);

      await act(async () => {
        result.current.deleteMeal('meal-123');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe('handleMealSuccess', () => {
    it('should close modals and invalidate queries', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useMealOperations(), { wrapper });

      // Open a modal first
      act(() => {
        result.current.openCreateModal('2024-01-15');
      });

      act(() => {
        result.current.handleMealSuccess();
      });

      expect(result.current.modalState.isCreateOpen).toBe(false);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['calendar-day'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['calendar-week'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['calendar-month'] });
    });
  });
});