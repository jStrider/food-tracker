import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MacroInputProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  showCalculatedValue?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Enhanced input component for nutritional macro values with validation
 */
export const MacroInput: React.FC<MacroInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  unit = "",
  min = 0,
  max = 10000,
  step = 0.1,
  error,
  showCalculatedValue,
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  // Validation
  const validateValue = (numValue: number): string => {
    if (numValue < min) {
      return `Value must be at least ${min}`;
    }
    if (numValue > max) {
      return `Value cannot exceed ${max}`;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    // Clear local error when user starts typing
    if (localError) {
      setLocalError('');
    }

    // Handle empty input
    if (rawValue === '') {
      onChange(undefined);
      return;
    }

    // Parse and validate
    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      const errorMsg = validateValue(numValue);
      if (errorMsg) {
        setLocalError(errorMsg);
      } else {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the value on blur if it's valid
    if (value !== undefined && !isNaN(value)) {
      const formatted = step === 1 ? value.toString() : value.toFixed(1);
      setInputValue(formatted);
    }
  };

  const hasError = !!(error || localError);
  const displayError = error || localError;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={cn(
          "text-sm font-medium",
          hasError && "text-destructive"
        )}>
          {label}
          {unit && <span className="text-muted-foreground ml-1">({unit})</span>}
        </Label>
        
        {showCalculatedValue !== undefined && !isFocused && (
          <span className="text-xs text-muted-foreground">
            Calculated: {step === 1 ? Math.round(showCalculatedValue) : showCalculatedValue.toFixed(1)}{unit}
          </span>
        )}
      </div>
      
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            hasError && "border-destructive focus-visible:ring-destructive",
            showCalculatedValue !== undefined && value === undefined && "bg-muted/30"
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        
        {/* Visual indicator for overridden values */}
        {value !== undefined && showCalculatedValue !== undefined && (
          <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" 
               title="Custom value overrides calculated value" />
        )}
      </div>
      
      {hasError && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      )}
      
      {!hasError && showCalculatedValue !== undefined && value === undefined && (
        <p className="text-xs text-muted-foreground">
          Will use calculated value from food entries
        </p>
      )}
    </div>
  );
};