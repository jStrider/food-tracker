import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FoodSearch from './FoodSearch';

// Mock the APIs
vi.mock('@/features/foods/api/foodsApi', () => ({
  foodsApi: {
    searchFoods: vi.fn(),
    searchFoodsAutocomplete: vi.fn(),
    searchByBarcode: vi.fn(),
  }
}));

vi.mock('@/features/meals/api/mealsApi', () => ({
  mealsApi: {
    getMeals: vi.fn(() => Promise.resolve([])),
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test wrapper with query client
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('FoodSearch Component - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component successfully', () => {
    render(
      <TestWrapper>
        <FoodSearch />
      </TestWrapper>
    );

    expect(screen.getByText('Food Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type food name for instant search...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter or scan barcode...')).toBeInTheDocument();
  });

  it('shows proper form elements', () => {
    render(
      <TestWrapper>
        <FoodSearch />
      </TestWrapper>
    );

    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Select Meal to Add Food To')).toBeInTheDocument();
    expect(screen.getByText('Search by Name')).toBeInTheDocument();
    expect(screen.getByText('Search by Barcode')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});