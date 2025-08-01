import { useState, useEffect, useCallback } from 'react';
import { MealType } from '@/features/meals/api/mealsApi';
import { getMealTypeFromTime } from '@/utils/mealHelpers';
import { useToast } from '@/hooks/use-toast';

// Helper function to get current time in HH:MM format
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export interface MealFormData {
  name: string;
  type: MealType | '';
  time: string;
  date: Date | undefined;
  customMacros: {
    calories: number | undefined;
    protein: number | undefined;
    carbs: number | undefined;
    fat: number | undefined;
  };
}

export interface UseMealFormOptions {
  defaultValues?: Partial<MealFormData>;
  autoFillTime?: boolean;
  showTimeBasedSuggestions?: boolean;
}

export interface MealFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Custom hook for managing meal form state and validation
 */
export const useMealForm = (options: UseMealFormOptions = {}) => {
  const { 
    defaultValues = {}, 
    autoFillTime = true, 
    showTimeBasedSuggestions = true 
  } = options;
  
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<MealFormData>({
    name: defaultValues.name || '',
    type: defaultValues.type || '',
    time: defaultValues.time || (autoFillTime ? getCurrentTime() : ''),
    date: defaultValues.date || new Date(),
    customMacros: {
      calories: defaultValues.customMacros?.calories,
      protein: defaultValues.customMacros?.protein,
      carbs: defaultValues.customMacros?.carbs,
      fat: defaultValues.customMacros?.fat,
    },
  });

  // UI state
  const [showMealTypePreview, setShowMealTypePreview] = useState<boolean>(
    showTimeBasedSuggestions && (!formData.type || formData.type === '') && !!formData.time
  );
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Validation state
  const [validation, setValidation] = useState<MealFormValidation>({
    isValid: true,
    errors: {},
  });

  // Auto-categorization logic
  const suggestedMealType = formData.time ? getMealTypeFromTime(formData.time) : 'snack';

  // Update field helper
  const updateField = useCallback((field: keyof MealFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Special handling for time changes
      if (field === 'time' && showTimeBasedSuggestions) {
        if (!newData.type || newData.type === '') {
          setShowMealTypePreview(true);
        }
      }
      
      // Special handling for type changes
      if (field === 'type') {
        setShowMealTypePreview(value === '');
      }
      
      return newData;
    });
    
    setIsDirty(true);
  }, [showTimeBasedSuggestions]);

  // Update custom macro helper
  const updateCustomMacro = useCallback((field: keyof MealFormData['customMacros'], value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      customMacros: {
        ...prev.customMacros,
        [field]: value,
      },
    }));
    setIsDirty(true);
  }, []);

  // Validation logic
  const validateForm = useCallback((): MealFormValidation => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Meal name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Meal name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Meal name cannot exceed 100 characters';
    }

    // Date validation
    if (!formData.date) {
      errors.date = 'Please select a date';
    }

    // Time validation (optional but if provided, should be valid)
    if (formData.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      errors.time = 'Please enter a valid time in HH:MM format';
    }

    // Custom macros validation
    const { calories, protein, carbs, fat } = formData.customMacros;
    
    if (calories !== undefined && (calories < 0 || calories > 10000)) {
      errors.calories = 'Calories must be between 0 and 10,000';
    }
    
    if (protein !== undefined && (protein < 0 || protein > 1000)) {
      errors.protein = 'Protein must be between 0 and 1,000g';
    }
    
    if (carbs !== undefined && (carbs < 0 || carbs > 1000)) {
      errors.carbs = 'Carbs must be between 0 and 1,000g';
    }
    
    if (fat !== undefined && (fat < 0 || fat > 1000)) {
      errors.fat = 'Fat must be between 0 and 1,000g';
    }

    const validationResult = {
      isValid: Object.keys(errors).length === 0,
      errors,
    };

    setValidation(validationResult);
    return validationResult;
  }, [formData]);

  // Auto-validate on form changes
  useEffect(() => {
    if (isDirty) {
      validateForm();
    }
  }, [formData, isDirty, validateForm]);

  // Reset form
  const resetForm = useCallback((newDefaults?: Partial<MealFormData>) => {
    const resetData = {
      name: newDefaults?.name || '',
      type: newDefaults?.type || '',
      time: newDefaults?.time || (autoFillTime ? getCurrentTime() : ''),
      date: newDefaults?.date || new Date(),
      customMacros: {
        calories: newDefaults?.customMacros?.calories,
        protein: newDefaults?.customMacros?.protein,
        carbs: newDefaults?.customMacros?.carbs,
        fat: newDefaults?.customMacros?.fat,
      },
    };
    
    setFormData(resetData);
    setIsDirty(false);
    setShowMealTypePreview(showTimeBasedSuggestions && (!resetData.type || resetData.type === '') && !!resetData.time);
    setValidation({ isValid: true, errors: {} });
  }, [autoFillTime, showTimeBasedSuggestions]);

  // Submit with validation
  const handleSubmit = useCallback((onSubmit: (data: MealFormData) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      const validationResult = validateForm();
      
      if (validationResult.isValid) {
        onSubmit(formData);
      } else {
        // Show first error as toast
        const firstError = Object.values(validationResult.errors)[0];
        if (firstError) {
          toast({
            title: 'Validation Error',
            description: firstError,
            variant: 'destructive',
          });
        }
      }
    };
  }, [formData, validateForm, toast]);

  // Get effective meal type (either selected or suggested)
  const effectiveMealType = formData.type || (formData.time ? suggestedMealType : 'snack');

  // Check if custom macros are provided
  const hasCustomMacros = Object.values(formData.customMacros).some(value => value !== undefined);

  return {
    // Form data
    formData,
    
    // Computed values
    suggestedMealType,
    effectiveMealType,
    hasCustomMacros,
    
    // UI state
    showMealTypePreview,
    isDirty,
    
    // Validation
    validation,
    isValid: validation.isValid,
    errors: validation.errors,
    
    // Actions
    updateField,
    updateCustomMacro,
    resetForm,
    validateForm,
    handleSubmit,
  };
};