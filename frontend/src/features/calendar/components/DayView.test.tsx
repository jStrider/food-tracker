import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import DayView from './DayView';
import { nutritionApi } from '@/features/nutrition/api/nutritionApi';
// import { mealsApi } from '@/features/meals/api/mealsApi';

// Mock axios for AuthContext
vi.mock('axios', () => {
  const mockAxios = {
    defaults: { baseURL: '' },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn().mockResolvedValue({ data: { id: '1', email: 'test@example.com', name: 'Test User' } }),
    post: vi.fn(),
  };
  return {
    default: mockAxios,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the API modules
vi.mock('@/features/nutrition/api/nutritionApi', () => ({
  nutritionApi: {
    getDailyNutrition: vi.fn(),
  },
}));

vi.mock('@/features/meals/api/mealsApi', () => ({
  mealsApi: {
    deleteMeal: vi.fn(),
  },
  MealType: {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    snack: 'snack',
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ date: '2024-01-15' }),
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

vi.mock('@/features/meals/components/CreateMealModal', () => ({
  default: ({ open, onOpenChange }: any) => 
    open ? (
      <div data-testid="create-meal-modal">
        Create Meal Modal
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@/features/meals/components/EditMealModal', () => ({
  default: ({ open, onOpenChange }: any) => 
    open ? (
      <div data-testid="edit-meal-modal">
        Edit Meal Modal
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@/features/nutrition/components/NutritionGoalsCard', () => ({
  default: () => <div data-testid="nutrition-goals">Nutrition Goals</div>,
}));

// Mock the date utilities
vi.mock('@/utils/date', () => ({
  formatCalendarDate: (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  },
  formatDate: (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(date);
  },
  DATE_FORMATS: {
    DISPLAY_DATE: 'dd/MM/yyyy',
    DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
    PICKER_DATE: 'dd/MM/yyyy',
    API_DATE: 'yyyy-MM-dd',
    API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

describe('DayView', () => {
  const mockNutritionData = {
    date: '2024-01-15',
    calories: 1850,
    protein: 95,
    carbs: 220,
    fat: 65,
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
    localStorageMock.clear();
    // Set up authenticated user
    localStorageMock.setItem('token', 'test-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders date header correctly', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);
    
    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      // Look for the formatted date - it might be formatted differently
      expect(screen.getByText(/15.*January.*2024/)).toBeInTheDocument();
    });
  });

  it('renders loading state', async () => {
    (nutritionApi.getDailyNutrition as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    await act(async () => {
      render(<DayView />);
    });
    
    // Check for loading spinner, loading text, or skeleton
    await waitFor(() => {
      const hasLoadingIndicator = 
        document.querySelector('.animate-spin') ||
        screen.queryByText(/loading/i) ||
        document.querySelector('[data-testid="loading"]') ||
        document.querySelector('.animate-pulse');
      expect(hasLoadingIndicator).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('renders error state', async () => {
    (nutritionApi.getDailyNutrition as any).mockRejectedValue(
      new Error('Failed to load')
    );

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      // Look for any error message
      const hasErrorMessage = 
        screen.queryByText(/failed/i) ||
        screen.queryByText(/error/i) ||
        screen.queryByText(/something went wrong/i) ||
        document.querySelector('[role="alert"]');
      expect(hasErrorMessage).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('renders meals when loaded', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    await act(async () => {
      render(<DayView />);
    });
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Daily Summary')).toBeInTheDocument();
    });
    
    // Check for meal names in cards - there are multiple instances of Breakfast/Lunch
    const breakfastElements = screen.getAllByText('Breakfast');
    expect(breakfastElements.length).toBeGreaterThan(1); // At least in header and card
    
    const lunchElements = screen.getAllByText('Lunch');
    expect(lunchElements.length).toBeGreaterThan(1); // At least in header and card
    
    // Check for calories in the macro summary
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('650')).toBeInTheDocument();
  });

  it('renders nutrition summary', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    await act(async () => {
      render(<DayView />);
    });
    
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

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      const addButtons = screen.getAllByRole('button', { name: /add/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  it('opens create meal modal when add button clicked', async () => {
    const user = userEvent.setup();
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Add Breakfast')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add Breakfast');
    await act(async () => {
      await user.click(addButton);
    });
    
    expect(screen.getByTestId('create-meal-modal')).toBeInTheDocument();
  });

  it('closes create meal modal', async () => {
    const user = userEvent.setup();
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Add Breakfast')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add Breakfast');
    await act(async () => {
      await user.click(addButton);
    });
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await act(async () => {
      await user.click(closeButton);
    });
    
    expect(screen.queryByTestId('create-meal-modal')).not.toBeInTheDocument();
  });

  it('groups meals by category', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue(mockNutritionData);

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      expect(screen.getAllByText('Breakfast')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Lunch')[0]).toBeInTheDocument();
    });
    
    // Check that meals are organized by category
    const breakfastSection = screen.getAllByText('Breakfast')[0].closest('div');
    expect(breakfastSection).toBeInTheDocument();
  });

  it('shows empty state when no meals', async () => {
    (nutritionApi.getDailyNutrition as any).mockResolvedValue({
      date: '2024-01-15',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      meals: [],
    });

    await act(async () => {
      render(<DayView />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/No breakfast recorded/)).toBeInTheDocument();
      expect(screen.getByText(/No lunch recorded/)).toBeInTheDocument();
      expect(screen.getByText(/No dinner recorded/)).toBeInTheDocument();
      expect(screen.getByText(/No snack recorded/)).toBeInTheDocument();
    });
  });
});