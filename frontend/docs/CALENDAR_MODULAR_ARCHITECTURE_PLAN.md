# Calendar Modular Architecture Refactoring Plan

## Overview
Refactor WeekView and DayView components to follow a modular architecture with reusable components, hooks, and clear separation of concerns.

## Current Problems
1. **Code Duplication**: Similar logic and UI patterns repeated across views
2. **Large Components**: DayView is ~500 lines, making it hard to maintain
3. **Mixed Concerns**: Business logic, UI, and state management in single components
4. **Hard to Test**: Large components with many dependencies

## Proposed Architecture

### 1. Shared Components (New)

#### `components/shared/CalendarHeader.tsx`
- Reusable header with navigation controls
- Props: title, onNavigate, onAddMeal
- Used by: DayView, WeekView, MonthView

#### `components/shared/MealCard.tsx`
- Individual meal card component
- Props: meal, onEdit, onDelete, isExpanded, onToggleExpand
- Handles meal display logic

#### `components/shared/MealCategorySection.tsx`
- Section for each meal category (breakfast, lunch, etc.)
- Props: category, meals, onAddMeal, onEditMeal, onDeleteMeal
- Groups meals by category

#### `components/shared/DailySummaryCard.tsx`
- Daily nutrition summary display
- Props: dailyNutrition
- Shows calories, macros, etc.

#### `components/shared/EmptyState.tsx`
- Empty state component for no data
- Props: message, action
- Consistent empty states

### 2. Custom Hooks (New)

#### `hooks/useMealManagement.ts`
- Centralized meal CRUD operations
- Handles create, edit, delete mutations
- Returns loading states and handlers

#### `hooks/useCalendarNavigation.ts`
- Navigation logic for calendar views
- Handles date changes and announcements
- Returns navigation handlers and current date

#### `hooks/useDailyNutrition.ts`
- Fetches and manages daily nutrition data
- Shared between DayView and WeekView
- Returns nutrition data and loading states

### 3. Constants & Utils

#### `constants/mealCategories.ts`
- Export MEAL_CATEGORIES configuration
- Export MACRO_CONFIG
- Centralized constants

#### `utils/mealHelpers.ts`
- formatTime function
- getMealCategoryColor function
- Other meal-related utilities

### 4. Refactored Components

#### `DayView.tsx` (Refactored)
```tsx
// Much smaller, ~150 lines
// Uses shared components and hooks
// Focuses on layout and composition
```

#### `WeekView.tsx` (Refactored)
```tsx
// Uses shared DayCard component
// Reuses navigation and data hooks
// Cleaner structure
```

## Implementation Steps

1. **Phase 1: Extract Constants and Utils**
   - Create constants/mealCategories.ts
   - Create utils/mealHelpers.ts
   - Update imports in existing components

2. **Phase 2: Create Custom Hooks**
   - Implement useMealManagement hook
   - Implement useCalendarNavigation hook
   - Implement useDailyNutrition hook

3. **Phase 3: Build Shared Components**
   - Create MealCard component
   - Create MealCategorySection component
   - Create DailySummaryCard component
   - Create CalendarHeader component
   - Create EmptyState component

4. **Phase 4: Refactor DayView**
   - Replace inline components with shared ones
   - Use custom hooks for logic
   - Reduce to ~150 lines

5. **Phase 5: Refactor WeekView**
   - Create DayCard component for week grid
   - Reuse shared components and hooks
   - Improve structure

## Benefits
- **Reusability**: Shared components across views
- **Maintainability**: Smaller, focused components
- **Testability**: Isolated units easy to test
- **Consistency**: Unified UI patterns
- **Performance**: Potential for memoization
- **Developer Experience**: Clear structure and separation

## Success Metrics
- [ ] DayView reduced from ~500 to ~150 lines
- [ ] WeekView uses shared components
- [ ] Zero code duplication
- [ ] All components < 200 lines
- [ ] Custom hooks with clear responsibilities
- [ ] Improved TypeScript types