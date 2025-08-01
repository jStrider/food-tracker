import { MealType } from '@/features/meals/api/mealsApi';

/**
 * Format time from 24-hour format to 12-hour format with AM/PM
 */
export const formatTime = (time?: string): string | null => {
  if (!time) return null;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Get the color class for a meal category
 */
export const getMealCategoryColor = (category: string): string => {
  switch (category) {
    case 'breakfast': return 'bg-yellow-500';
    case 'lunch': return 'bg-blue-500';
    case 'dinner': return 'bg-purple-500';
    case 'snack': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

/**
 * Group meals by category with proper typing
 */
export const groupMealsByCategory = (
  meals: any[]
): Record<MealType, any[]> => {
  const defaultCategories: Record<MealType, any[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };
  
  if (!meals || meals.length === 0) return defaultCategories;
  
  return meals.reduce((acc, meal) => {
    // Use type for backward compatibility, fall back to category
    const category = ((meal as any).type || meal.category || 'snack') as MealType;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(meal);
    return acc;
  }, defaultCategories);
};