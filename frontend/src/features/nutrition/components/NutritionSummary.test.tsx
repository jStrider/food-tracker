import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import NutritionSummary from './NutritionSummary';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';

// Mock the API module
vi.mock('@/features/nutrition/api/nutritionApi', () => ({
  nutritionApi: {
    getDailyNutrition: vi.fn(),
  },
}));

describe('NutritionSummary', () => {
  const mockDate = '2024-01-15';
  const mockNutritionData = {
    date: mockDate,
    calories: 1850,
    protein: 95,
    carbs: 220,
    fat: 65,
    fiber: 28,
    sugar: 45,
    sodium: 2100,
    meals: [
      {
        id: '1',
        name: 'Breakfast',
        type: 'breakfast',
        calories: 450,
        protein: 25,
        carbs: 60,
        fat: 15,
      },
      {
        id: '2',
        name: 'Lunch',
        type: 'lunch',
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

  it('renders loading state', () => {
    (nutritionApi.getDailyNutrition as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<NutritionSummary date={mockDate} />);
    
    expect(screen.getByText('Loading nutrition data...')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (nutritionApi.getDailyNutrition as any).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<NutritionSummary date={mockDate} />);
    
    expect(await screen.findByText(/Failed to load nutrition data/)).toBeInTheDocument();
  });

  it('renders nutrition data when loaded', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<NutritionSummary date={mockDate} />);
    
    // Check main macros
    expect(await screen.findByText('1850')).toBeInTheDocument(); // Calories
    expect(screen.getByText('95g')).toBeInTheDocument(); // Protein
    expect(screen.getByText('220g')).toBeInTheDocument(); // Carbs
    expect(screen.getByText('65g')).toBeInTheDocument(); // Fat
  });

  it('shows daily goals and progress', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<NutritionSummary date={mockDate} />);
    
    await screen.findByText('1850'); // Wait for data to load
    
    // Check that progress bars or goal indicators are present
    expect(screen.getByText('Daily Goals')).toBeInTheDocument();
  });

  it('displays meal breakdown', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<NutritionSummary date={mockDate} />);
    
    await screen.findByText('1850'); // Wait for data to load
    
    // Check meal breakdown section
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('450 cal')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('650 cal')).toBeInTheDocument();
  });

  it('updates when date changes', async () => {
    const { rerender } = render(<NutritionSummary date={mockDate} />);
    
    expect(nutritionApi.getDailyNutrition).toHaveBeenCalledWith(mockDate);
    
    const newDate = '2024-01-16';
    rerender(<NutritionSummary date={newDate} />);
    
    expect(nutritionApi.getDailyNutrition).toHaveBeenCalledWith(newDate);
  });

  it('shows zero values when no nutrition data', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue({
      date: mockDate,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      meals: [],
    });

    render(<NutritionSummary date={mockDate} />);
    
    expect(await screen.findByText('0')).toBeInTheDocument(); // Calories
    expect(screen.getByText('0g')).toBeInTheDocument(); // Macros
    expect(screen.getByText('No meals recorded for this day')).toBeInTheDocument();
  });

  it('calculates percentage of daily goals', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    render(<NutritionSummary date={mockDate} />);
    
    await screen.findByText('1850'); // Wait for data to load
    
    // Check that percentages are shown (assuming 2000 cal goal)
    expect(screen.getByText('93%')).toBeInTheDocument(); // 1850/2000
  });
});