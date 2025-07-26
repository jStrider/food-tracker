import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import FoodSearch from './FoodSearch';
import { createMockFood, createMockMeal } from '@/test/test-utils';

// Mock the API modules
vi.mock('@/features/foods/api/foodsApi', () => ({
  foodsApi: {
    searchFoods: vi.fn(),
    searchByBarcode: vi.fn(),
  },
  Food: {},
}));

vi.mock('@/features/meals/api/mealsApi', () => ({
  mealsApi: {
    getMeals: vi.fn(),
  },
  Meal: {},
}));

// Mock the AddFoodToMealModal component
vi.mock('./AddFoodToMealModal', () => ({
  default: ({ open, onOpenChange, food, mealId }: any) => 
    open ? (
      <div data-testid="add-food-modal">
        <div>Food: {food?.name}</div>
        <div>Meal ID: {mealId}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

// Import mocked functions
import { foodsApi } from '@/features/foods/api/foodsApi';
import { mealsApi } from '@/features/meals/api/mealsApi';

describe('FoodSearch', () => {
  const mockFoods = [
    createMockFood({ id: '1', name: 'Apple' }),
    createMockFood({ id: '2', name: 'Banana' }),
  ];

  const mockMeals = [
    createMockMeal({ id: '1', name: 'Breakfast', category: 'breakfast' }),
    createMockMeal({ id: '2', name: 'Lunch', category: 'lunch' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (mealsApi.getMeals as any).mockResolvedValue(mockMeals);
  });

  it('renders search input and meal selector', async () => {
    render(<FoodSearch />);
    
    expect(screen.getByPlaceholderText('Enter food name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter barcode...')).toBeInTheDocument();
    
    // Check that the select trigger is present
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
    expect(selectTrigger).toHaveTextContent('Select a meal');
  });

  it('searches for foods when typing', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockResolvedValue(mockFoods);
    
    render(<FoodSearch />);
    
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    await waitFor(() => {
      expect(foodsApi.searchFoods).toHaveBeenCalledWith('app');
    });
    
    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(await screen.findByText('Banana')).toBeInTheDocument();
  });

  it('shows loading state while searching', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockFoods), 100))
    );
    
    render(<FoodSearch />);
    
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    expect(await screen.findByText('Searching...')).toBeInTheDocument();
  });

  it('displays error message when search fails', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockRejectedValue(new Error('Search failed'));
    
    render(<FoodSearch />);
    
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    await waitFor(() => {
      expect(screen.getByText(/Error searching foods/)).toBeInTheDocument();
    });
  });

  it('searches by barcode when entering barcode', async () => {
    const user = userEvent.setup();
    const mockBarcodeFood = createMockFood({ id: '3', name: 'Barcode Product' });
    (foodsApi.searchByBarcode as any).mockResolvedValue(mockBarcodeFood);
    
    render(<FoodSearch />);
    
    const barcodeInput = screen.getByPlaceholderText('Enter barcode...');
    await user.type(barcodeInput, '1234567890');
    
    await waitFor(() => {
      expect(foodsApi.searchByBarcode).toHaveBeenCalledWith('1234567890');
    });
    
    expect(await screen.findByText('Barcode Product')).toBeInTheDocument();
  });

  it('loads meals for the selected date', async () => {
    render(<FoodSearch />);
    
    await waitFor(() => {
      expect(mealsApi.getMeals).toHaveBeenCalled();
    });
    
    // Check that meal options are available in the select
    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger);
    
    expect(await screen.findByText('Breakfast')).toBeInTheDocument();
    expect(await screen.findByText('Lunch')).toBeInTheDocument();
  });

  it('shows toast when trying to add food without selecting meal', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockResolvedValue(mockFoods);
    
    render(<FoodSearch />);
    
    // Search for food
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    // Wait for results and click add button
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
    
    const addButton = screen.getAllByRole('button')[1]; // First button is the select, second is add
    await user.click(addButton);
    
    // Check for error toast
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('opens add food modal when meal is selected', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockResolvedValue(mockFoods);
    
    render(<FoodSearch />);
    
    // Select a meal first
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    await user.click(await screen.findByText('Breakfast (breakfast)'));
    
    // Search for food
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    // Wait for results and click add button
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
    
    const addButton = screen.getAllByRole('button')[1]; // First button is the select, second is add
    await user.click(addButton);
    
    // Check that modal is open
    expect(await screen.findByTestId('add-food-modal')).toBeInTheDocument();
    expect(screen.getByText('Food: Apple')).toBeInTheDocument();
    expect(screen.getByText('Meal ID: 1')).toBeInTheDocument();
  });

  it('closes add food modal when close is clicked', async () => {
    const user = userEvent.setup();
    (foodsApi.searchFoods as any).mockResolvedValue(mockFoods);
    
    render(<FoodSearch />);
    
    // Select a meal and add food to open modal
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    await user.click(await screen.findByText('Breakfast (breakfast)'));
    
    const searchInput = screen.getByPlaceholderText('Enter food name...');
    await user.type(searchInput, 'app');
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
    
    const addButton = screen.getAllByRole('button')[1]; // First button is the select, second is add
    await user.click(addButton);
    
    // Modal should be open
    expect(await screen.findByTestId('add-food-modal')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('add-food-modal')).not.toBeInTheDocument();
    });
  });
});