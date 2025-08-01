# Calendar Architecture Improvement Plan

## Current State Analysis

### Existing Components
1. **CalendarView** - Main container managing view switching
2. **MonthView** - Grid display of days with meal indicators
3. **WeekView** - 7-day horizontal layout
4. **DayView** - Detailed meal list with nutrition summary

### Identified Issues
1. State management is fragmented across components
2. Navigation between views causes full re-renders
3. No shared calendar context for date management
4. Limited performance optimization (no virtualization)
5. Inconsistent data fetching patterns

## Proposed Architecture Improvements

### 1. Calendar Context & State Management

```typescript
// contexts/CalendarContext.tsx
interface CalendarState {
  currentDate: Date;
  viewType: 'month' | 'week' | 'day';
  selectedDate: Date | null;
  dateRange: { start: Date; end: Date };
  isLoading: boolean;
  cachedData: Map<string, any>;
}
```

Benefits:
- Centralized date management
- Cached data across views
- Smoother transitions
- Reduced API calls

### 2. Performance Optimizations

#### Virtual Scrolling for Month View
- Implement windowing for large date ranges
- Lazy load meal data on viewport entry
- Use React.memo for day cells

#### Optimistic Updates
- Immediate UI updates on meal operations
- Background sync with server
- Rollback on failure

#### Data Prefetching
- Prefetch adjacent months/weeks
- Background refresh stale data
- Smart cache invalidation

### 3. Enhanced Navigation System

```typescript
// hooks/useCalendarNavigation.ts
interface CalendarNavigation {
  goToDate: (date: Date) => void;
  goToToday: () => void;
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  switchView: (view: ViewType) => void;
  canNavigate: (direction: 'prev' | 'next') => boolean;
}
```

Features:
- Keyboard shortcuts (arrow keys, T for today)
- Swipe gestures on mobile
- URL sync for deep linking
- Breadcrumb navigation

### 4. Component Architecture Refactor

```
src/features/calendar/
├── components/
│   ├── CalendarContainer.tsx      // Main wrapper with context
│   ├── views/
│   │   ├── MonthView/
│   │   │   ├── index.tsx
│   │   │   ├── MonthGrid.tsx
│   │   │   ├── DayCell.tsx
│   │   │   └── MonthSummary.tsx
│   │   ├── WeekView/
│   │   │   ├── index.tsx
│   │   │   ├── WeekGrid.tsx
│   │   │   └── DayColumn.tsx
│   │   └── DayView/
│   │       ├── index.tsx
│   │       ├── MealList.tsx
│   │       └── DaySummary.tsx
│   ├── shared/
│   │   ├── CalendarHeader.tsx
│   │   ├── ViewSwitcher.tsx
│   │   ├── DateNavigator.tsx
│   │   └── CalendarSkeleton.tsx
│   └── modals/
│       ├── QuickAddMeal.tsx
│       └── MealDetails.tsx
├── hooks/
│   ├── useCalendarData.ts
│   ├── useCalendarNavigation.ts
│   └── useCalendarKeyboards.ts
├── contexts/
│   └── CalendarContext.tsx
├── utils/
│   ├── calendarHelpers.ts
│   └── dateCalculations.ts
└── api/
    └── calendarApi.ts
```

### 5. Data Layer Improvements

#### Unified Query Keys
```typescript
const calendarQueryKeys = {
  all: ['calendar'] as const,
  month: (year: number, month: number) => 
    [...calendarQueryKeys.all, 'month', year, month] as const,
  week: (startDate: string) => 
    [...calendarQueryKeys.all, 'week', startDate] as const,
  day: (date: string) => 
    [...calendarQueryKeys.all, 'day', date] as const,
};
```

#### Smart Caching Strategy
- Cache month data for 5 minutes
- Cache week data for 3 minutes  
- Cache day data for 1 minute
- Invalidate on meal CRUD operations

### 6. Mobile-First Responsive Design

- Touch gestures for navigation
- Adaptive layouts based on screen size
- Bottom sheet modals on mobile
- Simplified meal cards for small screens

### 7. Accessibility Enhancements

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus management between views

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. Create CalendarContext
2. Implement navigation hooks
3. Set up component structure
4. Add TypeScript interfaces

### Phase 2: View Components (Week 2)
1. Refactor MonthView with virtualization
2. Enhance WeekView with better layouts
3. Optimize DayView performance
4. Add loading/error states

### Phase 3: Features & Polish (Week 3)
1. Add keyboard shortcuts
2. Implement mobile gestures
3. Add animation transitions
4. Complete accessibility features

### Phase 4: Testing & Documentation (Week 4)
1. Unit tests for all components
2. Integration tests for navigation
3. Performance benchmarks
4. User documentation

## Success Metrics

1. **Performance**
   - Initial load time < 1s
   - View switch < 200ms
   - 60fps scrolling

2. **User Experience**
   - 90% fewer API calls
   - Smooth transitions
   - Offline capability

3. **Code Quality**
   - 90% test coverage
   - TypeScript strict mode
   - Zero accessibility violations

## Technical Decisions

1. **State Management**: React Context + React Query
2. **Virtualization**: react-window for month grid
3. **Animation**: Framer Motion for transitions
4. **Testing**: Vitest + React Testing Library
5. **Mobile**: react-use for gesture hooks