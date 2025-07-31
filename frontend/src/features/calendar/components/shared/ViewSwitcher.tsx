import React from 'react';
import { Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendar } from '@/contexts/CalendarContext';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { cn } from '@/lib/utils';

export type ViewType = 'month' | 'week' | 'day';

interface ViewOption {
  value: ViewType;
  label: string;
  icon: React.ReactNode;
  shortLabel?: string;
}

interface ViewSwitcherProps {
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

const viewOptions: ViewOption[] = [
  {
    value: 'month',
    label: 'Month',
    icon: <Calendar className="h-4 w-4" />,
    shortLabel: 'M'
  },
  {
    value: 'week',
    label: 'Week',
    icon: <CalendarDays className="h-4 w-4" />,
    shortLabel: 'W'
  },
  {
    value: 'day',
    label: 'Day',
    icon: <CalendarClock className="h-4 w-4" />,
    shortLabel: 'D'
  }
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  className,
  size = 'sm'
}) => {
  const { viewType } = useCalendar();
  const { changeView } = useCalendarNavigation();

  return (
    <div className={cn('flex items-center rounded-lg', className)}>
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        {viewOptions.map((option) => (
          <Button
            key={option.value}
            variant={viewType === option.value ? 'default' : 'ghost'}
            size={size}
            onClick={() => changeView(option.value)}
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium transition-all',
              viewType === option.value
                ? 'bg-white shadow-sm'
                : 'hover:text-gray-900'
            )}
            aria-label={`Switch to ${option.label} view`}
            title={`${option.label} view (${option.shortLabel})`}
          >
            <span className="hidden sm:inline-flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
            <span className="sm:hidden">
              {option.shortLabel}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ViewSwitcher;
