import React, { useCallback, useRef, useEffect, useState } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from 'date-fns';
import DayCell from './DayCell';
import { cn } from '@/lib/utils';
import { useWindowSize } from '@/hooks/useWindowSize';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface VirtualizedMonthGridProps {
  currentDate: Date;
  monthData: any[];
  onDateClick: (date: string) => void;
  onAddMeal: (date: string) => void;
}

// Constants for grid layout
const COLUMN_COUNT = 7; // Days of the week
const WEEKDAY_HEADER_HEIGHT = 48; // Height of weekday headers
const DEFAULT_ROW_HEIGHT = 120; // Default height for day cells
const MIN_ROW_HEIGHT = 100;
const MAX_ROW_HEIGHT = 200;

const VirtualizedMonthGrid: React.FC<VirtualizedMonthGridProps> = ({
  currentDate,
  monthData,
  onDateClick,
  onAddMeal,
}) => {
  const gridRef = useRef<Grid>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [containerWidth, setContainerWidth] = useState(windowWidth - 64);
  const [gridHeight, setGridHeight] = useState(Math.min(600, windowHeight - 300));
  
  // Monitor performance
  usePerformanceMonitor('VirtualizedMonthGrid');
  
  // Calculate the days to display (including padding days)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  // Get all days in the current month
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Calculate the starting day of the week (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  
  // Calculate padding days from previous month
  const paddingDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - i - 1);
    paddingDays.push(paddingDate);
  }
  
  // Calculate padding days for next month to complete the grid
  const totalDays = paddingDays.length + days.length;
  const remainingCells = Math.ceil(totalDays / 7) * 7 - totalDays;
  const endPaddingDays = [];
  for (let i = 1; i <= remainingCells; i++) {
    const paddingDate = new Date(monthEnd);
    paddingDate.setDate(paddingDate.getDate() + i);
    endPaddingDays.push(paddingDate);
  }
  
  // Combine all days
  const allDays = [...paddingDays, ...days, ...endPaddingDays];
  const rowCount = Math.ceil(allDays.length / COLUMN_COUNT);
  
  // Get data for a specific day
  const getDayData = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthData.find(d => d.date === dateStr);
  }, [monthData]);
  
  // Update container dimensions when window resizes
  useEffect(() => {
    const padding = 64; // Account for page padding
    const headerOffset = 300; // Account for headers and other UI elements
    setContainerWidth(windowWidth - padding);
    setGridHeight(Math.min(600, Math.max(400, windowHeight - headerOffset)));
  }, [windowWidth, windowHeight]);
  
  // Calculate column width based on container width
  const getColumnWidth = useCallback(() => {
    return containerWidth / COLUMN_COUNT;
  }, [containerWidth]);
  
  // Calculate row height based on content
  const getRowHeight = useCallback((index: number) => {
    // Return cached height if available
    if (rowHeights.current[index]) {
      return rowHeights.current[index];
    }
    
    // Calculate height based on content in this row
    let maxHeight = DEFAULT_ROW_HEIGHT;
    const startIdx = index * COLUMN_COUNT;
    const endIdx = Math.min(startIdx + COLUMN_COUNT, allDays.length);
    
    for (let i = startIdx; i < endIdx; i++) {
      const dayData = getDayData(allDays[i]);
      if (dayData && dayData.meals && dayData.meals.length > 0) {
        // Estimate height based on number of meals
        const estimatedHeight = MIN_ROW_HEIGHT + (dayData.meals.length * 20);
        maxHeight = Math.max(maxHeight, Math.min(estimatedHeight, MAX_ROW_HEIGHT));
      }
    }
    
    // Cache the calculated height
    rowHeights.current[index] = maxHeight;
    return maxHeight;
  }, [allDays, getDayData]);
  
  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const dayIndex = rowIndex * COLUMN_COUNT + columnIndex;
    if (dayIndex >= allDays.length) return null;
    
    const date = allDays[dayIndex];
    const dayData = getDayData(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    
    return (
      <div style={style} className={cn(!isCurrentMonth && 'opacity-50')}>
        <DayCell
          date={date}
          dayData={dayData}
          onDayClick={() => onDateClick(format(date, 'yyyy-MM-dd'))}
          onAddMealClick={() => onAddMeal(format(date, 'yyyy-MM-dd'))}
        />
      </div>
    );
  };
  
  // Weekday headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Reset row heights when month changes
  useEffect(() => {
    rowHeights.current = {};
    gridRef.current?.resetAfterIndices({ columnIndex: 0, rowIndex: 0 });
  }, [currentDate]);
  
  // Force update grid when data changes
  useEffect(() => {
    gridRef.current?.resetAfterIndices({ columnIndex: 0, rowIndex: 0 });
  }, [monthData]);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center py-3 text-sm font-medium text-gray-700"
            style={{ height: WEEKDAY_HEADER_HEIGHT }}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Virtualized grid */}
      <Grid
        ref={gridRef}
        className="calendar-grid"
        columnCount={COLUMN_COUNT}
        columnWidth={getColumnWidth}
        height={gridHeight}
        rowCount={rowCount}
        rowHeight={getRowHeight}
        width={containerWidth}
        overscanRowCount={1} // Render 1 extra row for smoother scrolling
      >
        {Cell}
      </Grid>
    </div>
  );
};

export default VirtualizedMonthGrid;