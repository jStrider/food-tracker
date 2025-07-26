import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import CreateMealModal from './CreateMealModal';
import { mealsApi } from '@/features/meals/api/mealsApi';

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
    const typeSelect = screen.getByRole('combobox');
    expect(typeSelect).toHaveTextContent('Breakfast');
    expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument();
  });

  it('uses provided default values', () => {
    render(
      <CreateMealModal
        {...defaultProps}
        defaultDate="2024-01-15"
        defaultType="lunch"
      />
    );
    
    const typeSelect = screen.getByRole('combobox');
    expect(typeSelect).toHaveTextContent('Lunch');
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
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
    
    const typeSelect = screen.getByRole('combobox');
    await user.click(typeSelect);
    
    const dinnerOption = await screen.findByText('Dinner');
    await user.click(dinnerOption);
    
    expect(typeSelect).toHaveTextContent('Dinner');
  });

  it('allows changing date', async () => {
    const user = userEvent.setup();
    render(<CreateMealModal {...defaultProps} />);
    
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');
    
    expect(dateInput).toHaveValue('2024-01-20');
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
    const { rerender } = render(<CreateMealModal {...defaultProps} />);
    
    // Fill in form
    const nameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    await userEvent.type(nameInput, 'Test Meal');
    
    // Close modal
    rerender(<CreateMealModal {...defaultProps} open={false} />);
    
    // Reopen modal
    rerender(<CreateMealModal {...defaultProps} open={true} />);
    
    // Check that form is reset
    const newNameInput = screen.getByPlaceholderText('e.g., Chicken salad');
    expect(newNameInput).toHaveValue('');
  });
});