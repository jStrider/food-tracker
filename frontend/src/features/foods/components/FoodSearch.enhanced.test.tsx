import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FoodSearch from './FoodSearch';
import { foodsApi } from '@/features/foods/api/foodsApi';
import { mealsApi } from '@/features/meals/api/mealsApi';

// Mock the APIs
vi.mock('@/features/foods/api/foodsApi');
vi.mock('@/features/meals/api/mealsApi');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock food data
const mockFoods = [
  {
    id: '1',
    name: 'Apple',
    brand: 'Fresh Fruits',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10,
    sodium: 1,
    servingSize: '100g',
    imageUrl: 'apple.jpg'
  },
  {
    id: '2',
    name: 'Apple Juice',
    brand: 'Nature Valley',
    calories: 46,
    protein: 0.1,
    carbs: 11,
    fat: 0.1,
    fiber: 0.2,
    sugar: 9.6,
    sodium: 4,
    servingSize: '100ml',
    imageUrl: 'apple-juice.jpg'
  },
  {
    id: '3',
    name: 'Green Apple',
    brand: 'Organic Farm',
    calories: 58,
    protein: 0.4,
    carbs: 15,
    fat: 0.3,
    fiber: 2.8,
    sugar: 11,
    sodium: 0,
    servingSize: '100g'
  }
];

const mockMeals = [
  {
    id: 'meal-1',
    name: 'Breakfast',
    category: 'breakfast',
    date: '2024-01-15',
    userId: 'user-1'
  },
  {
    id: 'meal-2',
    name: 'Lunch',
    category: 'lunch',
    date: '2024-01-15',
    userId: 'user-1'
  }
];

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

describe('Enhanced FoodSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses
    vi.mocked(foodsApi.searchFoods).mockResolvedValue(mockFoods);
    vi.mocked(foodsApi.searchByBarcode).mockResolvedValue(mockFoods[0]);
    vi.mocked(mealsApi.getMeals).mockResolvedValue(mockMeals);
  });

  describe('Enhanced UI Features', () => {
    it('renders with improved header and result counter', () => {
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      expect(screen.getByText('Food Search')).toBeInTheDocument();
      expect(screen.getByText('0 results')).toBeInTheDocument();
    });

    it('shows enhanced meal selection with category badges', async () => {
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Select Meal to Add Food To')).toBeInTheDocument();
      });

      // Open meal selector
      const mealSelect = screen.getByRole('combobox');
      fireEvent.click(mealSelect);

      await waitFor(() => {
        expect(screen.getByText('Breakfast')).toBeInTheDocument();
        expect(screen.getByText('Lunch')).toBeInTheDocument();
      });
    });

    it('displays enhanced search input with clear button', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'apple');

      // Clear button should appear
      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('shows enhanced barcode input with validation message', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const barcodeInput = screen.getByPlaceholderText('Enter or scan barcode...');
      await user.type(barcodeInput, '12345');

      // Should show validation message for short barcode
      expect(screen.getByText('Barcode should be at least 8 digits')).toBeInTheDocument();
    });
  });

  describe('Real-time Autocomplete', () => {
    it('shows autocomplete dropdown when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      // Wait for debounced search
      await waitFor(() => {
        expect(vi.mocked(foodsApi.searchFoods)).toHaveBeenCalledWith('app');
      }, { timeout: 1000 });

      // Autocomplete dropdown should appear
      await waitFor(() => {
        const dropdown = screen.getByRole('list') || screen.getByTestId('autocomplete-dropdown');
        expect(dropdown).toBeInTheDocument();
      });

      // Should show food suggestions
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Apple Juice')).toBeInTheDocument();
    });

    it('handles keyboard navigation in autocomplete', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      // Wait for autocomplete to appear
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      // Test arrow key navigation
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Should select the food item
      await waitFor(() => {
        expect(searchInput).toHaveValue('Apple Juice');
      });
    });

    it('closes autocomplete on Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      // Autocomplete should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      });
    });

    it('shows limited results in autocomplete with "more results" indicator', async () => {
      // Mock more than 8 results
      const manyFoods = Array.from({ length: 12 }, (_, i) => ({
        ...mockFoods[0],
        id: `food-${i}`,
        name: `Apple ${i + 1}`
      }));
      
      vi.mocked(foodsApi.searchFoods).mockResolvedValue(manyFoods);
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      await waitFor(() => {
        expect(screen.getByText('Apple 1')).toBeInTheDocument();
      });

      // Should show "more results" indicator
      expect(screen.getByText('+4 more results below')).toBeInTheDocument();
    });
  });

  describe('Enhanced Search Results', () => {
    it('displays enhanced food cards with nutritional info tooltip', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'apple');

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });

      // Should show enhanced food cards
      const foodCards = screen.getAllByText('Apple');
      expect(foodCards).toHaveLength(2); // Apple and Green Apple

      // Test nutritional info tooltip
      const infoButton = screen.getAllByRole('button', { name: /nutritional info/i })[0];
      await user.click(infoButton);

      // Tooltip should show detailed nutritional information
      await waitFor(() => {
        expect(screen.getByText('Macro Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Protein')).toBeInTheDocument();
        expect(screen.getByText('Carbs')).toBeInTheDocument();
        expect(screen.getByText('Fat')).toBeInTheDocument();
      });
    });

    it('shows cache indicators for cached foods', async () => {
      // Mock cached food result
      const cachedFoods = mockFoods.map(food => ({ ...food, isFromCache: true }));
      vi.mocked(foodsApi.searchFoods).mockResolvedValue(cachedFoods);
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'apple');

      await waitFor(() => {
        expect(screen.getAllByText('Cached')).toHaveLength(3);
      });
    });

    it('displays proper empty state when no results found', async () => {
      vi.mocked(foodsApi.searchFoods).mockResolvedValue([]);
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No foods found')).toBeInTheDocument();
        expect(screen.getByText(/No results for "nonexistent"/)).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Barcode Search', () => {
    it('shows enhanced barcode result with detailed info', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const barcodeInput = screen.getByPlaceholderText('Enter or scan barcode...');
      await user.type(barcodeInput, '1234567890123');

      await waitFor(() => {
        expect(screen.getByText('Barcode Result')).toBeInTheDocument();
        expect(screen.getByText('Found')).toBeInTheDocument();
      });

      // Should show enhanced food card for barcode result
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('shows proper empty state for barcode not found', async () => {
      vi.mocked(foodsApi.searchByBarcode).mockResolvedValue(null);
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const barcodeInput = screen.getByPlaceholderText('Enter or scan barcode...');
      await user.type(barcodeInput, '1234567890123');

      await waitFor(() => {
        expect(screen.getByText('No product found')).toBeInTheDocument();
        expect(screen.getByText(/No product found for barcode "1234567890123"/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and UX Improvements', () => {
    it('debounces search input to prevent excessive API calls', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      
      // Type quickly
      await user.type(searchInput, 'a');
      await user.type(searchInput, 'p');
      await user.type(searchInput, 'p');

      // Should only call API once after debounce delay
      await waitFor(() => {
        expect(vi.mocked(foodsApi.searchFoods)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(foodsApi.searchFoods)).toHaveBeenCalledWith('app');
      }, { timeout: 1000 });
    });

    it('shows loading indicators during search', async () => {
      // Mock slow API response
      vi.mocked(foodsApi.searchFoods).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockFoods), 500))
      );
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('handles error states gracefully with user-friendly messages', async () => {
      vi.mocked(foodsApi.searchFoods).mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      await waitFor(() => {
        expect(screen.getByText('Search Error:')).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Improvements', () => {
    it('provides proper ARIA labels and keyboard navigation', async () => {
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      expect(searchInput).toHaveAttribute('aria-label');
      
      const barcodeInput = screen.getByPlaceholderText('Enter or scan barcode...');
      expect(barcodeInput).toHaveAttribute('aria-label');
    });

    it('supports screen readers with proper announcements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FoodSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Type food name for instant search...');
      await user.type(searchInput, 'app');

      await waitFor(() => {
        // Should have aria-live region for search results
        const resultsRegion = screen.getByRole('region', { name: /search results/i });
        expect(resultsRegion).toHaveAttribute('aria-live');
      });
    });
  });
});