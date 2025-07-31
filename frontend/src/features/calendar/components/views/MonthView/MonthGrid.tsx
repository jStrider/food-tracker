import React, { memo, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useCalendar } from '@/contexts/CalendarContext';
import DayCell from './DayCell';
import { MonthData, CalendarDay } from '@/features/calendar/api/calendarApi';

interface MonthGridProps {
  monthData: MonthData;
  onDateSelect: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthGrid: React.FC<MonthGridProps> = memo(({ monthData, onDateSelect }) => {
  const { currentDate } = useCalendar();
  
  // Memoize month calculations
  const { monthStart, monthEnd, calendarDays } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    return { monthStart: start, monthEnd: end, calendarDays: days };
  }, [currentDate]);

  // Memoize padding days calculation
  const allDays = useMemo(() => {
    // Add padding days to start from Sunday
    const firstDayOfWeek = monthStart.getDay();
    const paddingDaysStart = Array(firstDayOfWeek).fill(null).map((_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      return date;
    });

    // Add padding days to complete the last week
    const lastDayOfWeek = monthEnd.getDay();
    const paddingDaysEnd = Array(6 - lastDayOfWeek).fill(null).map((_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i + 1);
      return date;
    });

    return [...paddingDaysStart, ...calendarDays, ...paddingDaysEnd];
  }, [monthStart, monthEnd, calendarDays]);

  // Memoize day data lookup function
  const getDayData = useCallback((date: Date): CalendarDay | null => {
    if (!monthData?.days || monthData.days.length === 0) return null;
    const dateString = format(date, 'yyyy-MM-dd');
    return monthData.days.find(day => day.date === dateString) || null;
  }, [monthData?.days]);

  // Memoize weekday headers
  const weekdayHeaders = useMemo(() => (
    WEEKDAYS.map(day => (
      <div 
        key={day} 
        className="text-center font-medium text-gray-500 text-sm py-2"
        aria-label={day}
      >
        <span className="hidden sm:inline">{day}</span>
        <span className="sm:hidden">{day.slice(0, 1)}</span>
      </div>
    ))
  ), []);

  // Memoize calendar cells
  const calendarCells = useMemo(() => (
    allDays.map((date, index) => {
      const dayData = getDayData(date);
      const dateString = format(date, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(date, currentDate);
      
      return (
        <DayCell
          key={`${dateString}-${index}`}
          date={date}
          dayData={dayData}
          isCurrentMonth={isCurrentMonth}
          onSelect={() => onDateSelect(dateString)}
        />
      );
    })
  ), [allDays, getDayData, currentDate, onDateSelect]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-2">
        {weekdayHeaders}
      </div>
      
      {/* Calendar days grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {calendarCells}
      </div>
    </div>
  );
});

MonthGrid.displayName = 'MonthGrid';

export default MonthGrid;