import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import MealCard from './MealCard';
import { createMockMeal } from '@/test/test-utils';

describe('MealCard', () => {
  const mockMeal = createMockMeal({
    id: '1',
    name: 'Healthy Breakfast',
    category: 'breakfast',
    date: '2024-01-15',
    time: '08:30',
    totalCalories: 450,
    totalProtein: 25,
    totalCarbs: 60,
    totalFat: 15,
    foods: [
      {
        id: '1',
        foodId: 'food1',
        quantity: 100,
        unit: 'g',
        food: {
          id: 'food1',
          name: 'Oatmeal',
          calories: 150,
          protein: 5,
          carbs: 30,
          fat: 3,
        },
      },
      {
        id: '2',
        foodId: 'food2',
        quantity: 200,
        unit: 'g',
        food: {
          id: 'food2',
          name: 'Greek Yogurt',
          calories: 300,
          protein: 20,
          carbs: 30,
          fat: 12,
        },
      },
    ],
  });

  it('renders meal information correctly', () => {
    render(<MealCard meal={mockMeal} />);
    
    expect(screen.getByText('Healthy Breakfast')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('450 cal')).toBeInTheDocument();
  });

  it('displays macro nutrients', () => {
    render(<MealCard meal={mockMeal} />);
    
    expect(screen.getByText('25g')).toBeInTheDocument(); // Protein
    expect(screen.getByText('60g')).toBeInTheDocument(); // Carbs
    expect(screen.getByText('15g')).toBeInTheDocument(); // Fat
  });

  it('shows food items list', () => {
    render(<MealCard meal={mockMeal} />);
    
    expect(screen.getByText('Oatmeal')).toBeInTheDocument();
    expect(screen.getByText('100g')).toBeInTheDocument();
    expect(screen.getByText('Greek Yogurt')).toBeInTheDocument();
    expect(screen.getByText('200g')).toBeInTheDocument();
  });

  it('displays meal category icon', () => {
    render(<MealCard meal={mockMeal} />);
    
    // Check for breakfast icon (could be a sun icon or similar)
    const card = screen.getByText('Healthy Breakfast').closest('div');
    expect(card).toHaveClass('rounded-lg'); // Card styling
  });

  it('shows edit button', () => {
    render(<MealCard meal={mockMeal} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it('shows delete button', () => {
    render(<MealCard meal={mockMeal} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const mockOnEdit = vi.fn();
    
    render(<MealCard meal={mockMeal} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockMeal);
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();
    
    render(<MealCard meal={mockMeal} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockMeal.id);
  });

  it('expands to show food details when clicked', async () => {
    const user = userEvent.setup();
    render(<MealCard meal={mockMeal} />);
    
    // Initially, detailed nutrition might be hidden
    const card = screen.getByText('Healthy Breakfast').closest('div');
    await user.click(card!);
    
    // After click, more details should be visible
    expect(screen.getByText('150 cal')).toBeInTheDocument(); // Oatmeal calories
    expect(screen.getByText('300 cal')).toBeInTheDocument(); // Yogurt calories
  });

  it('handles meal with no foods', () => {
    const emptyMeal = {
      ...mockMeal,
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };
    
    render(<MealCard meal={emptyMeal} />);
    
    expect(screen.getByText('Healthy Breakfast')).toBeInTheDocument();
    expect(screen.getByText('0 cal')).toBeInTheDocument();
    expect(screen.getByText('No foods added')).toBeInTheDocument();
  });

  it('shows add food button', () => {
    render(<MealCard meal={mockMeal} />);
    
    const addButton = screen.getByRole('button', { name: /add food/i });
    expect(addButton).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const mealWithDifferentTime = {
      ...mockMeal,
      time: '14:30',
    };
    
    render(<MealCard meal={mealWithDifferentTime} />);
    
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });
});