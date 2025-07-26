import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatDate,
  toUserTimezone,
  toUTC,
  getUserTimezone,
  DATE_FORMATS
} from '@/utils/date';

export interface DatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  timezone?: string;
  displayFormat?: string;
  min?: Date | string;
  max?: Date | string;
  id?: string;
  name?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  timezone,
  displayFormat = DATE_FORMATS.PICKER_DATE,
  min,
  max,
  id,
  name
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const tz = timezone || getUserTimezone();

  // Convert value to Date object in user's timezone
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const date = typeof value === 'string' ? new Date(value) : value;
    return toUserTimezone(date, tz);
  }, [value, tz]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert from user's timezone to UTC before calling onChange
      const utcDate = toUTC(date, tz);
      onChange?.(utcDate);
    } else {
      onChange?.(undefined);
    }
    setOpen(false);
  };

  const displayValue = React.useMemo(() => {
    if (!selectedDate) return '';
    return formatDate(selectedDate, displayFormat, tz);
  }, [selectedDate, displayFormat, tz]);

  const disabledDays = React.useCallback((date: Date) => {
    if (min) {
      const minDate = typeof min === 'string' ? new Date(min) : min;
      if (date < minDate) return true;
    }
    if (max) {
      const maxDate = typeof max === 'string' ? new Date(max) : max;
      if (date > maxDate) return true;
    }
    return false;
  }, [min, max]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Date picker"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? displayValue : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledDays}
          fromDate={min ? new Date(min) : undefined}
          toDate={max ? new Date(max) : undefined}
        />
        <div className="p-3 text-xs text-muted-foreground border-t">
          Timezone: {tz}
        </div>
      </PopoverContent>
    </Popover>
  );
}