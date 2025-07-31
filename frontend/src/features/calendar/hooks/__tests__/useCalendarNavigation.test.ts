import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useCalendarNavigation } from '../useCalendarNavigation';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useCalendarNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCalendarNavigation());

    expect(result.current.currentDate).toEqual(new Date('2024-01-15'));
    expect(result.current.viewType).toBe('month');
  });

  it('should initialize with custom date', () => {
    const customDate = new Date('2024-02-01');
    const { result } = renderHook(() => useCalendarNavigation(customDate));

    expect(result.current.currentDate).toEqual(customDate);
  });

  describe('navigation functions', () => {
    it('should navigate to previous month in month view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.navigatePrevious();
      });

      expect(result.current.currentDate).toEqual(new Date('2023-12-15'));
    });

    it('should navigate to next month in month view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.navigateNext();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-02-15'));
    });

    it('should navigate to previous week in week view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.setViewType('week');
      });

      act(() => {
        result.current.navigatePrevious();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-01-08'));
    });

    it('should navigate to next week in week view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.setViewType('week');
      });

      act(() => {
        result.current.navigateNext();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-01-22'));
    });

    it('should navigate to previous day in day view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.setViewType('day');
      });

      act(() => {
        result.current.navigatePrevious();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-01-14'));
    });

    it('should navigate to next day in day view', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2024-01-15')));

      act(() => {
        result.current.setViewType('day');
      });

      act(() => {
        result.current.navigateNext();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-01-16'));
    });
  });

  describe('navigateToToday', () => {
    it('should set current date to today', () => {
      const { result } = renderHook(() => useCalendarNavigation(new Date('2023-12-01')));

      act(() => {
        result.current.navigateToToday();
      });

      expect(result.current.currentDate).toEqual(new Date('2024-01-15'));
    });
  });

  describe('navigateToDate', () => {
    it('should navigate to specific date with Date object', () => {
      const { result } = renderHook(() => useCalendarNavigation());
      const targetDate = new Date('2024-03-20');

      act(() => {
        result.current.navigateToDate(targetDate);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/day/2024-03-20');
    });

    it('should navigate to specific date with string', () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.navigateToDate('2024-03-20');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/day/2024-03-20');
    });
  });

  describe('changeView', () => {
    it('should change view type to week', () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.setViewType('week');
      });

      expect(result.current.viewType).toBe('week');
      expect(mockNavigate).toHaveBeenCalledWith('/calendar');
    });

    it('should change view type to day and navigate', () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.setViewType('day');
      });

      expect(result.current.viewType).toBe('day');
      expect(mockNavigate).toHaveBeenCalledWith('/day/2024-01-15');
    });

    it('should not navigate when already in day view', () => {
      const { result } = renderHook(() => useCalendarNavigation());

      act(() => {
        result.current.setViewType('day');
      });

      mockNavigate.mockClear();

      act(() => {
        result.current.setViewType('day');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});