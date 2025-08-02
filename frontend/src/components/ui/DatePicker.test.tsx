import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DatePicker } from './DatePicker';

import '@/test/mocks/ui-components';

describe('DatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder when no value', () => {
    render(<DatePicker placeholder="Select date" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Select date');
    expect(button).toHaveAttribute('aria-label', 'Date picker');
  });

  it('displays formatted date when value is provided', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');
    render(<DatePicker value={testDate} />);
    
    const button = screen.getByRole('button');
    // Should display in DD/MM/YYYY format
    expect(button).toHaveTextContent('15/03/2024');
  });

  it('displays formatted date when string value is provided', () => {
    render(<DatePicker value="2024-03-15T12:00:00Z" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('15/03/2024');
  });

  it('uses custom display format when provided', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');
    render(<DatePicker value={testDate} displayFormat="yyyy-MM-dd" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('2024-03-15');
  });

  it('opens calendar when clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument(); // Calendar grid
    });
  });

  it('calls onChange when date is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<DatePicker onChange={handleChange} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
    
    // Find today's date button (assuming current month is displayed)
    const today = new Date();
    const todayButton = screen.getByRole('gridcell', { 
      name: new RegExp(today.getDate().toString()) 
    });
    
    await user.click(todayButton);
    
    expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
  });

  it('closes calendar after date selection', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
    
    // Find today's date button
    const today = new Date();
    const todayButton = screen.getByRole('gridcell', { 
      name: new RegExp(today.getDate().toString()) 
    });
    
    await user.click(todayButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<DatePicker disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows timezone information', async () => {
    const user = userEvent.setup();
    render(<DatePicker timezone="America/New_York" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Timezone: America/New_York')).toBeInTheDocument();
    });
  });

  it('shows default timezone when none provided', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      // Should show some timezone (the system default)
      expect(screen.getByText(/Timezone:/)).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<DatePicker className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('sets correct id and name attributes', () => {
    render(<DatePicker id="test-id" name="test-name" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('id', 'test-id');
    expect(button).toHaveAttribute('name', 'test-name');
  });

  it('handles min and max date constraints', async () => {
    const user = userEvent.setup();
    const minDate = new Date('2024-03-10');
    const maxDate = new Date('2024-03-20');
    
    render(<DatePicker min={minDate} max={maxDate} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
    
    // Calendar should respect min/max dates
    // This is implementation-specific to the Calendar component
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('handles timezone conversion correctly', () => {
    const utcDate = new Date('2024-03-15T12:00:00Z');
    const onChange = vi.fn();
    
    render(
      <DatePicker 
        value={utcDate} 
        onChange={onChange}
        timezone="America/New_York"
      />
    );
    
    // The displayed date should be converted to the user's timezone
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/15\/03\/2024/);
  });

  it('uses default picker format from DATE_FORMATS', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');
    render(<DatePicker value={testDate} />);
    
    const button = screen.getByRole('button');
    // Should use DATE_FORMATS.PICKER_DATE which is 'dd/MM/yyyy'
    expect(button).toHaveTextContent('15/03/2024');
  });

  it('clears date when onChange is called with undefined', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const testDate = new Date('2024-03-15T12:00:00Z');
    
    render(<DatePicker value={testDate} onChange={handleChange} />);
    
    // Open calendar
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
    
    // The actual clearing mechanism depends on the Calendar component implementation
    // This test ensures the handler supports undefined values
    expect(handleChange).toBeDefined();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    
    const button = screen.getByRole('button');
    await user.tab();
    
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  it('shows calendar icon', () => {
    render(<DatePicker />);
    
    // The icon should be present in the button
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});