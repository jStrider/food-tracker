import { MealType } from '@/features/meals/api/mealsApi';

export const MEAL_CATEGORIES: { value: MealType; label: string; color: string }[] = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-blue-100 text-blue-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-purple-100 text-purple-800' },
  { value: 'snack', label: 'Snack', color: 'bg-green-100 text-green-800' },
];

export const MACRO_CONFIG = [
  { key: 'calories', label: 'Calories', unit: '', color: 'text-blue-600' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'text-green-600' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-orange-600' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'text-purple-600' },
] as const;

export type MacroKey = typeof MACRO_CONFIG[number]['key'];