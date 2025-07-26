import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text..." />);
    
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('accepts text input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text..." />);
    
    const input = screen.getByPlaceholderText('Enter text...');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('calls onChange handler when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input placeholder="Enter text..." onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Enter text...');
    await user.type(input, 'Test');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input placeholder="Enter text..." disabled />);
    
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input placeholder="Enter text..." className="custom-class" />);
    
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toHaveClass('custom-class');
  });

  it('renders with type email', () => {
    render(<Input type="email" placeholder="Enter email..." />);
    
    const input = screen.getByPlaceholderText('Enter email...');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with type password', () => {
    render(<Input type="password" placeholder="Enter password..." />);
    
    const input = screen.getByPlaceholderText('Enter password...');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with type number', () => {
    render(<Input type="number" placeholder="Enter number..." />);
    
    const input = screen.getByPlaceholderText('Enter number...');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('accepts value prop', () => {
    render(<Input value="Test Value" readOnly />);
    
    const input = screen.getByDisplayValue('Test Value');
    expect(input).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="Enter text..." />);
    
    expect(ref).toHaveBeenCalled();
  });
});