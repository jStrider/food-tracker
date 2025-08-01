import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMealForm } from '../useMealForm';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useMealForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the current time to a consistent value for testing
    vi.spyOn(Date.prototype, 'toTimeString').mockReturnValue('10:30:00 GMT+0100 (CET)');
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMealForm());

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.type).toBe('');
    expect(result.current.formData.time).toBe('10:30'); // Mocked current time
    expect(result.current.formData.date).toBeInstanceOf(Date);
    expect(result.current.formData.customMacros).toEqual({
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
    });
  });

  it('should initialize with provided default values', () => {
    const defaultValues = {
      name: 'Test Meal',
      type: 'lunch' as const,
      time: '12:00',
      customMacros: {
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 20,
      },
    };

    const { result } = renderHook(() => 
      useMealForm({ defaultValues })
    );

    expect(result.current.formData.name).toBe('Test Meal');
    expect(result.current.formData.type).toBe('lunch');
    expect(result.current.formData.time).toBe('12:00');
    expect(result.current.formData.customMacros.calories).toBe(500);
  });

  it('should update field values correctly', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateField('name', 'Updated Meal');
    });

    expect(result.current.formData.name).toBe('Updated Meal');
    expect(result.current.isDirty).toBe(true);
  });

  it('should update custom macro values correctly', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateCustomMacro('calories', 350);
    });

    expect(result.current.formData.customMacros.calories).toBe(350);
    expect(result.current.isDirty).toBe(true);
  });

  it('should show meal type preview when conditions are met', () => {
    const { result } = renderHook(() => 
      useMealForm({ showTimeBasedSuggestions: true })
    );

    // Should show preview initially if no type is set and time is available
    expect(result.current.showMealTypePreview).toBe(true);

    act(() => {
      result.current.updateField('type', 'breakfast');
    });

    // Should hide preview when type is manually selected
    expect(result.current.showMealTypePreview).toBe(false);
  });

  it('should provide correct suggested meal type based on time', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateField('time', '08:00');
    });

    expect(result.current.suggestedMealType).toBe('breakfast');

    act(() => {
      result.current.updateField('time', '13:00');
    });

    expect(result.current.suggestedMealType).toBe('lunch');

    act(() => {
      result.current.updateField('time', '19:00');
    });

    expect(result.current.suggestedMealType).toBe('dinner');
  });

  it('should validate form correctly', () => {
    const { result } = renderHook(() => useMealForm());

    // Initially should be valid (no dirty state)
    expect(result.current.isValid).toBe(true);

    act(() => {
      result.current.updateField('name', ''); // Empty name should be invalid
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.name).toBe('Meal name is required');

    act(() => {
      result.current.updateField('name', 'Valid Meal Name');
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors.name).toBeUndefined();
  });

  it('should validate custom macros correctly', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateField('name', 'Test Meal'); // Make form dirty with valid name
      result.current.updateCustomMacro('calories', -100); // Invalid calories
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.calories).toBe('Calories must be between 0 and 10,000');

    act(() => {
      result.current.updateCustomMacro('calories', 500); // Valid calories
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors.calories).toBeUndefined();
  });

  it('should detect when custom macros are provided', () => {
    const { result } = renderHook(() => useMealForm());

    expect(result.current.hasCustomMacros).toBe(false);

    act(() => {
      result.current.updateCustomMacro('calories', 300);
    });

    expect(result.current.hasCustomMacros).toBe(true);
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() => useMealForm());

    // Make form dirty
    act(() => {
      result.current.updateField('name', 'Test Meal');
      result.current.updateCustomMacro('calories', 500);
    });

    expect(result.current.formData.name).toBe('Test Meal');
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.customMacros.calories).toBeUndefined();
    expect(result.current.isDirty).toBe(false);
  });

  it('should provide effective meal type', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateField('time', '08:00');
    });

    // Should use suggested type when no type is selected
    expect(result.current.effectiveMealType).toBe('breakfast');

    act(() => {
      result.current.updateField('type', 'lunch');
    });

    // Should use selected type when available
    expect(result.current.effectiveMealType).toBe('lunch');
  });

  it('should validate time format', () => {
    const { result } = renderHook(() => useMealForm());

    act(() => {
      result.current.updateField('name', 'Test Meal');
      result.current.updateField('time', '25:00'); // Invalid time
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.time).toBe('Please enter a valid time in HH:MM format');

    act(() => {
      result.current.updateField('time', '08:30'); // Valid time
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors.time).toBeUndefined();
  });
});