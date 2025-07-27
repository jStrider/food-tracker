# FoodTracker Test Strategy

## Overview
This document outlines the comprehensive testing strategy for the FoodTracker application, covering unit tests, integration tests, and end-to-end tests across both backend and frontend.

## Testing Philosophy
- **Test Pyramid**: Many unit tests, fewer integration tests, minimal E2E tests
- **Coverage Goals**: Backend >80%, Frontend >70%, E2E critical paths
- **Continuous Integration**: All tests run on every commit
- **Test-Driven Development**: Write tests alongside new features

## Backend Testing Strategy

### Unit Tests
**Scope**: Individual services, utilities, and pure functions
**Framework**: Jest + TypeScript
**Database**: In-memory SQLite for isolation

#### Services to Test:
1. **MealsService**
   - CRUD operations
   - Auto-categorization logic
   - Date filtering
   - Nutrition calculations

2. **FoodsService**
   - Search functionality
   - OpenFoodFacts integration
   - Caching logic
   - Food-meal associations

3. **NutritionService**
   - Daily/weekly/monthly calculations
   - Goal tracking
   - Aggregation logic

4. **CalendarService**
   - Calendar data formatting
   - Date range queries
   - Meal grouping

5. **MCP Service**
   - Tool execution
   - Response formatting
   - Error handling

### Integration Tests
**Scope**: API endpoints with real database interactions
**Framework**: Supertest + Jest
**Database**: SQLite test database

#### Endpoints to Test:
- `/meals` - Full CRUD cycle
- `/foods` - Search and caching
- `/nutrition` - Summary calculations
- `/calendar` - Multi-view data
- `/health` - Service monitoring

### Backend Test Structure
```
backend/
├── src/
│   ├── features/
│   │   ├── meals/
│   │   │   ├── meals.service.spec.ts
│   │   │   ├── meals.controller.spec.ts
│   │   │   └── meals.integration.spec.ts
│   │   ├── foods/
│   │   │   ├── foods.service.spec.ts
│   │   │   ├── foods.controller.spec.ts
│   │   │   └── foods.integration.spec.ts
│   │   └── ...
│   └── test/
│       ├── fixtures/
│       ├── helpers/
│       └── setup.ts
```

## Frontend Testing Strategy

### Unit Tests
**Scope**: Components, hooks, utilities
**Framework**: Vitest + React Testing Library
**Mocking**: MSW for API calls

#### Components to Test:
1. **Calendar Components**
   - DayView, WeekView, MonthView
   - Navigation and date selection
   - Meal display and interactions

2. **Meal Components**
   - CreateMealModal
   - EditMealModal
   - MealCard display

3. **Food Components**
   - FoodSearch
   - AddFoodToMealModal
   - FoodEntry management

4. **Common Components**
   - LoadingSpinner
   - ErrorBoundary
   - Toast notifications

### Integration Tests
**Scope**: Feature workflows
**Framework**: Vitest + React Testing Library

#### Workflows to Test:
- Complete meal creation flow
- Food search and addition
- Calendar navigation
- Nutrition goal tracking

### Frontend Test Structure
```
frontend/
├── src/
│   ├── features/
│   │   ├── calendar/
│   │   │   ├── components/
│   │   │   │   ├── DayView.test.tsx
│   │   │   │   ├── WeekView.test.tsx
│   │   │   │   └── MonthView.test.tsx
│   │   │   └── hooks/
│   │   │       └── useCalendar.test.ts
│   │   └── ...
│   └── test/
│       ├── setup.ts
│       ├── mocks/
│       └── utils/
```

## E2E Testing Strategy

### Framework
**Tool**: Playwright
**Browsers**: Chrome, Firefox, Safari
**Viewports**: Desktop, tablet, mobile

### Critical User Journeys
1. **Meal Management**
   - Create new meal
   - Add foods to meal
   - Edit meal details
   - Delete meal

2. **Food Search**
   - Search by name
   - Search by barcode
   - View nutrition info
   - Add to meal

3. **Calendar Navigation**
   - Switch between views
   - Navigate dates
   - View daily summaries

4. **Nutrition Tracking**
   - View daily totals
   - Check weekly progress
   - Set and track goals

### E2E Test Structure
```
e2e/
├── tests/
│   ├── meal-management.spec.ts
│   ├── food-search.spec.ts
│   ├── calendar.spec.ts
│   └── nutrition.spec.ts
├── fixtures/
├── pages/
└── playwright.config.ts
```

## Implementation Plan

### Phase 1: Backend Unit Tests (Week 1)
- [ ] Configure Jest and test database
- [ ] Implement service tests
- [ ] Implement controller tests
- [ ] Achieve >80% coverage

### Phase 2: Backend Integration Tests (Week 1-2)
- [ ] Configure Supertest
- [ ] Test all API endpoints
- [ ] Test error scenarios
- [ ] Test database transactions

### Phase 3: Frontend Unit Tests (Week 2)
- [ ] Install and configure Vitest
- [ ] Test all components
- [ ] Test custom hooks
- [ ] Mock API calls with MSW

### Phase 4: Frontend Integration Tests (Week 2-3)
- [ ] Test complete workflows
- [ ] Test error handling
- [ ] Test loading states
- [ ] Achieve >70% coverage

### Phase 5: E2E Tests (Week 3)
- [ ] Install and configure Playwright
- [ ] Implement critical journeys
- [ ] Configure CI pipeline
- [ ] Test cross-browser compatibility

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - Test backend unit tests
      - Test backend integration tests
      - Generate coverage report

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - Test frontend unit tests
      - Test frontend integration tests
      - Generate coverage report

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - Run Playwright tests
      - Upload test artifacts
```

## Testing Best Practices

### General Guidelines
1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should describe what they test
3. **Speed**: Prioritize fast tests
4. **Reliability**: No flaky tests allowed
5. **Maintenance**: Keep tests simple and maintainable

### Backend Specific
- Use factories for test data
- Mock external services (OpenFoodFacts)
- Test edge cases and error scenarios
- Use transactions for database tests

### Frontend Specific
- Test user interactions, not implementation
- Use data-testid for reliable selectors
- Test accessibility (keyboard, screen reader)
- Mock API responses consistently

### E2E Specific
- Use page object pattern
- Implement retry strategies
- Take screenshots on failure
- Test on multiple viewports

## Success Metrics
- Backend coverage >80%
- Frontend coverage >70%
- All E2E tests passing
- <5 minute total test execution
- Zero flaky tests
- 100% CI pipeline success rate