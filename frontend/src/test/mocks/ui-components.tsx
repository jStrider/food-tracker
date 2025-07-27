import React from 'react';
import { vi } from 'vitest';

// Mock scrollIntoView for jsdom
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
  
  // Mock hasPointerCapture for jsdom
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
}

// Mock Select components for testing
export const mockSelect = {
  Select: ({ children, value, onValueChange }: any) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <div data-testid="mock-select">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { value, onValueChange, isOpen, setIsOpen })
        )}
      </div>
    );
  },
  SelectTrigger: ({ children, onClick, ...props }: any) => (
    <button
      {...props}
      role="combobox"
      onClick={(e) => {
        props.setIsOpen?.(!props.isOpen);
        onClick?.(e);
      }}
      aria-expanded={props.isOpen}
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder, ...props }: any) => {
    const value = props.value;
    // Map values to display text
    const displayMap: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      '': placeholder || 'Select...',
    };
    return <span>{displayMap[value] || value || placeholder}</span>;
  },
  SelectContent: ({ children, ...props }: any) => {
    if (!props.isOpen) return null;
    return (
      <div role="listbox" data-testid="select-content">
        {children}
      </div>
    );
  },
  SelectItem: ({ children, value, ...props }: any) => (
    <div
      role="option"
      aria-selected={props.value === value}
      onClick={() => {
        props.onValueChange?.(value);
        props.setIsOpen?.(false);
      }}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  ),
};

// Mock DatePicker for testing
export const mockDatePicker = ({ value, onChange, placeholder, ...props }: any) => {
  const formattedDate = value
    ? new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(value)
    : '';

  return (
    <button
      {...props}
      type="button"
      aria-label="Date picker"
      onClick={() => {
        // Simulate date selection
        const newDate = new Date('2024-01-15');
        onChange?.(newDate);
      }}
    >
      {formattedDate || placeholder || 'Pick a date'}
    </button>
  );
};

// Setup mocks
vi.mock('@/components/ui/select', () => ({
  Select: mockSelect.Select,
  SelectContent: mockSelect.SelectContent,
  SelectItem: mockSelect.SelectItem,
  SelectTrigger: mockSelect.SelectTrigger,
  SelectValue: mockSelect.SelectValue,
}));

vi.mock('@/components/ui/DatePicker', () => ({
  DatePicker: mockDatePicker,
}));