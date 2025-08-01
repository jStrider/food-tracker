import { MealType } from '@/features/meals/api/mealsApi';

/**
 * Determines the meal type based on the provided time
 * @param time - Time in HH:MM format (24-hour)
 * @returns The appropriate meal type
 */
export function getMealTypeFromTime(time: string): MealType {
  if (!time) return 'snack'; // Default to snack if no time provided
  
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Breakfast: 5:00 AM - 10:59 AM (300 - 659 minutes)
  if (totalMinutes >= 300 && totalMinutes < 660) {
    return 'breakfast';
  }
  
  // Lunch: 11:00 AM - 2:59 PM (660 - 899 minutes)
  if (totalMinutes >= 660 && totalMinutes < 900) {
    return 'lunch';
  }
  
  // Afternoon Snack: 3:00 PM - 5:59 PM (900 - 1079 minutes)
  if (totalMinutes >= 900 && totalMinutes < 1080) {
    return 'snack';
  }
  
  // Dinner: 6:00 PM - 8:59 PM (1080 - 1139 minutes)
  if (totalMinutes >= 1080 && totalMinutes < 1140) {
    return 'dinner';
  }
  
  // Evening Snack: 9:00 PM - 11:59 PM (1140 - 1439 minutes)
  if (totalMinutes >= 1140 && totalMinutes < 1440) {
    return 'snack';
  }
  
  // Default to snack for early morning hours (12:00 AM - 4:59 AM)
  return 'snack';
}

/**
 * Determines if a meal type was likely auto-categorized based on time
 * @param time - Time in HH:MM format
 * @param mealType - The current meal type
 * @returns True if the meal type matches what would be auto-categorized
 */
export function isAutoCategorizationMatch(time: string, mealType: MealType): boolean {
  return getMealTypeFromTime(time) === mealType;
}