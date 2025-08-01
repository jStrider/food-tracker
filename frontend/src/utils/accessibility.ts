import { format, isToday } from 'date-fns';

/**
 * Generates accessible labels for calendar dates
 */
export const getDateLabel = (
  date: Date,
  context: 'calendar' | 'navigation' = 'calendar',
  additionalInfo?: {
    hasData?: boolean;
    mealCount?: number;
    totalCalories?: number;
    isSelected?: boolean;
  }
): string => {
  const dateText = format(date, 'EEEE, MMMM d, yyyy');
  const todayText = isToday(date) ? ', today' : '';
  
  if (context === 'navigation') {
    return `${dateText}${todayText}`;
  }

  const { hasData, mealCount, totalCalories, isSelected } = additionalInfo || {};
  
  const parts = [dateText + todayText];
  
  if (isSelected) {
    parts.push('selected');
  }
  
  if (hasData && mealCount && totalCalories) {
    parts.push(`${mealCount} meal${mealCount !== 1 ? 's' : ''}`);
    parts.push(`${totalCalories} calories total`);
  } else if (!hasData) {
    parts.push('no meals recorded');
  }
  
  return parts.join(', ');
};

/**
 * Generates accessible labels for meal categories
 */
export const getMealCategoryLabel = (
  category: string,
  mealCount: number,
  isExpanded?: boolean
): string => {
  const expandedText = isExpanded !== undefined 
    ? isExpanded ? 'expanded' : 'collapsed'
    : '';
  
  const countText = `${mealCount} meal${mealCount !== 1 ? 's' : ''}`;
  
  return `${category} section, ${countText}${expandedText ? ', ' + expandedText : ''}`;
};

/**
 * Generates accessible labels for meal cards
 */
export const getMealLabel = (
  meal: {
    name: string;
    time?: string;
    calories?: number;
    category?: string;
  },
  position?: { current: number; total: number }
): string => {
  const { name, time, calories, category } = meal;
  
  const parts = [name];
  
  if (time) {
    parts.push(`at ${time}`);
  }
  
  if (calories) {
    parts.push(`${calories} calories`);
  }
  
  if (category) {
    parts.push(`in ${category}`);
  }
  
  if (position) {
    parts.push(`item ${position.current} of ${position.total}`);
  }
  
  return parts.join(', ');
};

/**
 * Generates accessible labels for nutrition summaries
 */
export const getNutritionLabel = (nutrition: {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}): string => {
  const parts = [];
  
  if (nutrition.calories) {
    parts.push(`${nutrition.calories} calories`);
  }
  
  if (nutrition.protein) {
    parts.push(`${nutrition.protein} grams protein`);
  }
  
  if (nutrition.carbs) {
    parts.push(`${nutrition.carbs} grams carbohydrates`);
  }
  
  if (nutrition.fat) {
    parts.push(`${nutrition.fat} grams fat`);
  }
  
  if (nutrition.fiber) {
    parts.push(`${nutrition.fiber} grams fiber`);
  }
  
  if (nutrition.sugar) {
    parts.push(`${nutrition.sugar} grams sugar`);
  }
  
  if (nutrition.sodium) {
    parts.push(`${nutrition.sodium} milligrams sodium`);
  }
  
  return parts.join(', ');
};

/**
 * Generates accessible labels for view switcher buttons
 */
export const getViewSwitcherLabel = (
  viewType: string,
  isActive: boolean
): string => {
  const activeText = isActive ? 'current view' : 'switch to view';
  return `${viewType} view, ${activeText}`;
};

/**
 * Generates accessible labels for navigation buttons
 */
export const getNavigationLabel = (
  direction: 'previous' | 'next',
  period: 'month' | 'week' | 'day',
  targetDate?: Date
): string => {
  const directionText = direction === 'previous' ? 'Previous' : 'Next';
  const targetText = targetDate ? `, ${format(targetDate, 'MMMM yyyy')}` : '';
  
  return `${directionText} ${period}${targetText}`;
};

/**
 * Generates accessible descriptions for color-coded elements
 */
export const getColorDescription = (
  color: string,
  meaning: string
): string => {
  return `${meaning} (${color} indicator)`;
};

/**
 * Generates accessible labels for action buttons
 */
export const getActionLabel = (
  action: string,
  target: string,
  context?: string
): string => {
  const contextText = context ? ` for ${context}` : '';
  return `${action} ${target}${contextText}`;
};

/**
 * Formats time for screen readers
 */
export const formatTimeForScreenReader = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const minute = parseInt(minutes);
  
  const hourText = hour === 0 ? '12' : hour > 12 ? (hour - 12).toString() : hour.toString();
  const amPm = hour < 12 ? 'AM' : 'PM';
  const minuteText = minute === 0 ? '' : ` ${minute.toString().padStart(2, '0')}`;
  
  return `${hourText}${minuteText} ${amPm}`;
};

/**
 * Creates accessible instructions for keyboard navigation
 */
export const getKeyboardInstructions = (context: 'calendar' | 'menu' | 'modal'): string => {
  const common = 'Use Tab to navigate, Enter or Space to select';
  
  switch (context) {
    case 'calendar':
      return `${common}, arrow keys to navigate dates, Escape to close`;
    case 'menu':
      return `${common}, arrow keys to navigate options, Escape to close`;
    case 'modal':
      return `${common}, Escape to close dialog`;
    default:
      return common;
  }
};

/**
 * Checks if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Creates ARIA describedby IDs
 */
export const createDescribedByIds = (...ids: (string | undefined)[]): string => {
  return ids.filter(Boolean).join(' ');
};

/**
 * Generates unique accessible IDs
 */
let idCounter = 0;
export const generateAccessibleId = (prefix: string = 'accessible'): string => {
  idCounter++;
  return `${prefix}-${idCounter}-${Date.now()}`;
};