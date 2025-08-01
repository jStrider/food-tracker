import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { cn } from '@/lib/utils';

interface DateNavigatorProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  showLabel?: boolean;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  className,
  align = 'start',
  showLabel = true
}) => {
  const { currentDate } = useCalendar();
  const { navigateToDate } = useCalendarNavigation();
  const [open, setOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      navigateToDate(date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !currentDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline mr-2 text-gray-500">Jump to:</span>
          )}
          {currentDate ? format(currentDate, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={handleDateSelect}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateNavigator;
