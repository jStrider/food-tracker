import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import CreateMealModal from './CreateMealModal';
import { mealsApi } from '@/features/meals/api/mealsApi';
import '@/test/mocks/ui-components';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

// Mock the DatePicker component
vi.mock('@/components/ui/DatePicker', () => ({
  DatePicker: ({ value, onChange, placeholder, ...props }: any) => {
    const formattedDate = value
      ? new Intl.DateTimeFormat('fr-FR').format(new Date(value))
      : '';
    
    return (
      <button
        {...props}
        type="button"
        aria-label="Date picker"
        onClick={() => {
          const newDate = new Date('2024-01-15');
          onChange?.(newDate);
        }}
      >
        {formattedDate || placeholder || 'Pick a date'}
      </button>
    );
  },
}));

// Mock the API module
vi.mock('@/features/meals/api/mealsApi', () => ({
  mealsApi: {
    createMeal: vi.fn(),
  },
  MealType: {},
}));

describe('CreateMealModal', () => {
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<CreateMealModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Meal')).toBeInTheDocument();
    expect(screen.getByText('Add a new meal to your daily nutrition tracking.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateMealModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Create New Meal')).not.toBeInTheDocument();
  });

  it('displays form fields with defaults', () => {
    render(<CreateMealModal {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('e.g., Chicken salad')).toBeInTheDocument();
    // Check that the select shows 'Breakfast' as default
    const typeSelects = screen.getAllByRole('combobox');
    // Find the meal type selector - it should show "Breakfast" by default
    const typeSelect = typeSelects[0];
    expect(typeSelect).toHaveTextContent('Breakfast');
    // Date picker shows formatted date, not in an input
    const dateButton = screen.getByLabelText('Date picker');
    expect(dateButton).toBeInTheDocument();
  });

  it('uses provided default values', () => {
    render(
      <CreateMealModal
        {...defaultProps}
        defaultDate="2024-01-15"
        defaultType="lunch"
      />
    );
    
    const typeSelects = screen.getAllByRole('combobox');
    // The meal type selector should show "Lunch"
    const typeSelect = typeSelects[0];
    expect(typeSelect).toHaveTextContent('Lunch');
    // Date picker shows formatted date in dd/MM/yyyy format
    const dateButton = screen.getByLabelText('Date picker');
    expect(dateButton).toHaveTextContent('15/01/2024');
  });

  it('allows entering meal name', async () => {
    const user = userEvent.setup();
    render(<CreateMealModal {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Healthy Breakfast');
    
    expect(nameInput).toHaveValue('Healthy Breakfast');
  });

  it('allows selecting meal type', async () => {
    const user = userEvent.setup();
    render(<CreateMealModal {...defaultProps} />);
    
    // Find the meal type select
    const typeSelects = screen.getAllByRole('combobox');
    const typeSelect = typeSelects[0];
    expect(typeSelect).toHaveTextContent('Breakfast');
    
    // Click to open the dropdown
    await user.click(typeSelect);
    
    // Wait for the dropdown to be visible and click Dinner
    const dinnerOption = await screen.findByText('Dinner');
    await user.click(dinnerOption);
    
    // After selection, verify the select shows the new value
    await waitFor(() => {
      expect(typeSelect).toHaveTextContent('Dinner');
    });
  });

  it('allows changing date', async () => {
    const user = userEvent.setup();
    render(<CreateMealModal {...defaultProps} />);
    
    // Date picker is a button, not an input
    const dateButton = screen.getByLabelText('Date picker');
    expect(dateButton).toBeInTheDocument();
    
    // Click to open the date picker
    await user.click(dateButton);
    
    // For now, just verify the calendar opened
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument(); // Calendar grid
    });
  });

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateMealModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('creates meal when form is submitted', async () => {
    const user = userEvent.setup();
    const mockMeal = {
      id: '1',
      name: 'Test Breakfast',
      category: 'breakfast',
      date: '2024-01-15',
    };
    
    (mealsApi.createMeal as any).mockResolvedValue(mockMeal);
    
    render(<CreateMealModal {...defaultProps} />);
    
    // Fill in the form
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Test Breakfast');
    
    const createButton = screen.getByRole('button', { name: 'Create Meal' });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mealsApi.createMeal).toHaveBeenCalledWith({
        name: 'Test Breakfast',
        category: 'breakfast',
        date: expect.any(String),
      });
    });
  });

  it('shows success toast after creating meal', async () => {
    const user = userEvent.setup();
    const mockMeal = {
      id: '1',
      name: 'Test Meal',
      category: 'lunch',
      date: '2024-01-15',
    };
    
    (mealsApi.createMeal as any).mockResolvedValue(mockMeal);
    
    render(<CreateMealModal {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Test Meal');
    
    const createButton = screen.getByRole('button', { name: 'Create Meal' });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('closes modal after successful creation', async () => {
    const user = userEvent.setup();
    const mockMeal = {
      id: '1',
      name: 'Test Meal',
      category: 'dinner',
      date: '2024-01-15',
    };
    
    (mealsApi.createMeal as any).mockResolvedValue(mockMeal);
    
    render(<CreateMealModal {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Test Meal');
    
    const createButton = screen.getByRole('button', { name: 'Create Meal' });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error toast when creation fails', async () => {
    const user = userEvent.setup();
    (mealsApi.createMeal as any).mockRejectedValue(new Error('Failed to create meal'));
    
    render(<CreateMealModal {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Test Meal');
    
    const createButton = screen.getByRole('button', { name: 'Create Meal' });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('resets form when modal is reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CreateMealModal {...defaultProps} />);
    
    // Fill in form
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await user.type(nameInput, 'Test Meal');
    
    // Close modal by clicking cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    // Reopen modal
    rerender(<CreateMealModal {...defaultProps} open={true} />);
    
    // Check that form is reset
    const newNameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    expect(newNameInput).toHaveValue('');
  });
});