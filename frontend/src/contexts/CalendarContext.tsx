import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export type ViewType = 'month' | 'week' | 'day';

interface CalendarState {
  currentDate: Date;
  viewType: ViewType;
  selectedDate: Date | null;
  dateRange: { start: Date; end: Date };
  isLoading: boolean;
  error: string | null;
  cachedData: Map<string, any>;
}

type CalendarAction =
  | { type: 'SET_CURRENT_DATE'; payload: Date }
  | { type: 'SET_VIEW_TYPE'; payload: ViewType }
  | { type: 'SET_SELECTED_DATE'; payload: Date | null }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CACHED_DATA'; payload: { key: string; data: any } }
  | { type: 'CLEAR_CACHE' };

interface CalendarContextValue extends CalendarState {
  // Navigation actions
  goToDate: (date: Date) => void;
  goToToday: () => void;
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  switchView: (view: ViewType) => void;
  selectDate: (date: Date | null) => void;
  
  // Cache actions
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any) => void;
  clearCache: () => void;
  
  // Utility functions
  isToday: (date: Date) => boolean;
  isSelected: (date: Date) => boolean;
  isInCurrentRange: (date: Date) => boolean;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

const calculateDateRange = (date: Date, viewType: ViewType): { start: Date; end: Date } => {
  switch (viewType) {
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
      };
    case 'day':
      return {
        start: date,
        end: date
      };
  }
};

const calendarReducer = (state: CalendarState, action: CalendarAction): CalendarState => {
  switch (action.type) {
    case 'SET_CURRENT_DATE':
      return {
        ...state,
        currentDate: action.payload,
        dateRange: calculateDateRange(action.payload, state.viewType)
      };
    
    case 'SET_VIEW_TYPE':
      return {
        ...state,
        viewType: action.payload,
        dateRange: calculateDateRange(state.currentDate, action.payload)
      };
    
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload
      };
    
    case 'SET_DATE_RANGE':
      return {
        ...state,
        dateRange: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'SET_CACHED_DATA': {
      const newCache = new Map(state.cachedData);
      newCache.set(action.payload.key, action.payload.data);
      return {
        ...state,
        cachedData: newCache
      };
    }
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        cachedData: new Map()
      };
    
    default:
      return state;
  }
};

interface CalendarProviderProps {
  children: ReactNode;
  initialDate?: Date;
  initialView?: ViewType;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
  initialDate = new Date(),
  initialView = 'month'
}) => {
  const [state, dispatch] = useReducer(calendarReducer, {
    currentDate: initialDate,
    viewType: initialView,
    selectedDate: null,
    dateRange: calculateDateRange(initialDate, initialView),
    isLoading: false,
    error: null,
    cachedData: new Map()
  });

  // Navigation functions
  const goToDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_CURRENT_DATE', payload: date });
  }, []);

  const goToToday = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_DATE', payload: new Date() });
  }, []);

  const goToPreviousPeriod = useCallback(() => {
    const { currentDate, viewType } = state;
    let newDate: Date;
    
    switch (viewType) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        break;
      case 'week':
        newDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
        newDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        break;
    }
    
    dispatch({ type: 'SET_CURRENT_DATE', payload: newDate });
  }, [state.currentDate, state.viewType]);

  const goToNextPeriod = useCallback(() => {
    const { currentDate, viewType } = state;
    let newDate: Date;
    
    switch (viewType) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'week':
        newDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
        newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
    }
    
    dispatch({ type: 'SET_CURRENT_DATE', payload: newDate });
  }, [state.currentDate, state.viewType]);

  const switchView = useCallback((view: ViewType) => {
    dispatch({ type: 'SET_VIEW_TYPE', payload: view });
  }, []);

  const selectDate = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  // Cache functions
  const getCachedData = useCallback((key: string) => {
    return state.cachedData.get(key);
  }, [state.cachedData]);

  const setCachedData = useCallback((key: string, data: any) => {
    dispatch({ type: 'SET_CACHED_DATA', payload: { key, data } });
  }, []);

  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  // Utility functions
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  }, []);

  const isSelected = useCallback((date: Date) => {
    if (!state.selectedDate) return false;
    return format(date, 'yyyy-MM-dd') === format(state.selectedDate, 'yyyy-MM-dd');
  }, [state.selectedDate]);

  const isInCurrentRange = useCallback((date: Date) => {
    return date >= state.dateRange.start && date <= state.dateRange.end;
  }, [state.dateRange]);

  const value: CalendarContextValue = {
    ...state,
    goToDate,
    goToToday,
    goToPreviousPeriod,
    goToNextPeriod,
    switchView,
    selectDate,
    getCachedData,
    setCachedData,
    clearCache,
    isToday,
    isSelected,
    isInCurrentRange
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

// Export calendar query keys for consistent cache management
export const calendarQueryKeys = {
  all: ['calendar'] as const,
  month: (year: number, month: number) => 
    [...calendarQueryKeys.all, 'month', year, month] as const,
  week: (startDate: string) => 
    [...calendarQueryKeys.all, 'week', startDate] as const,
  day: (date: string) => 
    [...calendarQueryKeys.all, 'day', date] as const,
};
