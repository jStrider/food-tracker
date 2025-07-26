import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import DayView from './DayView';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';

// Mock the API module
vi.mock('@/features/nutrition/api/nutritionApi', () => ({
  nutritionApi: {
    getDailyNutrition: vi.fn(),
  },
}));

// Mock the child components
vi.mock('@/features/meals/components/MealCard', () => ({
  default: ({ meal }: any) => (
    <div data-testid={`meal-${meal.id}`}>
      <div>{meal.name}</div>
      <div>{meal.calories} cal</div>
    </div>
  ),
}));

vi.mock('@/features/meals/components/CreateMealModal', () => ({
  default: ({ open, onOpenChange }: any) => 
    open ? (
      <div data-testid="create-meal-modal">
        Create Meal Modal
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

describe('DayView', () => {
  const mockDate = new Date('2024-01-15');
  const mockNutritionData = {
    date: '2024-01-15',
    totalCalories: 1850,
    totalProtein: 95,
    totalCarbs: 220,
    totalFat: 65,
    meals: [
      {
        id: '1',
        name: 'Breakfast',
        category: 'breakfast',
        calories: 450,
        protein: 25,
        carbs: 60,
        fat: 15,
      },
      {
        id: '2',
        name: 'Lunch',
        category: 'lunch',
        calories: 650,
        protein: 35,
        carbs: 80,
        fat: 25,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders date header correctly', () => {
    render(<DayView date={mockDate} />);
    
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    (nutritionApi.getDailyNutrition as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DayView date={mockDate} />);
    
    expect(screen.getByText(/Loading meals/)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (nutritionApi.getDailyNutrition as any).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<DayView date={mockDate} />);
    
    expect(await screen.findByText(/Failed to load meals/)).toBeInTheDocument();
  });

  it('renders meals when loaded', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('meal-1')).toBeInTheDocument();
      expect(screen.getByTestId('meal-2')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('450 cal')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('650 cal')).toBeInTheDocument();
  });

  it('renders nutrition summary', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Summary')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1850')).toBeInTheDocument(); // Total calories
    expect(screen.getByText('95g')).toBeInTheDocument(); // Protein
    expect(screen.getByText('220g')).toBeInTheDocument(); // Carbs
    expect(screen.getByText('65g')).toBeInTheDocument(); // Fat
  });

  it('shows add meal button', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    const addButton = await screen.findByRole('button', { name: /add meal/i });
    expect(addButton).toBeInTheDocument();
  });

  it('opens create meal modal when add button clicked', async () => {
    const user = userEvent.setup();
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    const addButton = await screen.findByRole('button', { name: /add meal/i });
    await user.click(addButton);
    
    expect(screen.getByTestId('create-meal-modal')).toBeInTheDocument();
  });

  it('closes create meal modal', async () => {
    const user = userEvent.setup();
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    const addButton = await screen.findByRole('button', { name: /add meal/i });
    await user.click(addButton);
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);
    
    expect(screen.queryByTestId('create-meal-modal')).not.toBeInTheDocument();
  });

  it('groups meals by category', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<DayView date={mockDate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    });
    
    // Check that meals are organized by category
    const breakfastSection = screen.getByText('Breakfast').closest('div');
    expect(breakfastSection).toBeInTheDocument();
  });

  it('shows empty state when no meals', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue({
      date: '2024-01-15',
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      meals: [],
    });

    render(<DayView date={mockDate} />);
    
    expect(await screen.findByText(/No meals recorded/)).toBeInTheDocument();
  });
});