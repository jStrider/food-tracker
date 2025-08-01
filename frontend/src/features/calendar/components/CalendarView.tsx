import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { getViewSwitcherLabel } from '@/utils/accessibility';

type ViewType = 'month' | 'week' | 'day';

const CalendarView: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('month');
  const navigate = useNavigate();
  const { date } = useParams<{ date?: string }>();
  const { announce, createLiveRegion } = useAnnouncements();
  
  // Keyboard navigation for view switcher
  const { containerRef } = useKeyboardNavigation({
    enableArrowKeys: true,
    onSelectionChange: (index) => {
      // Focus the button at the given index
      const buttons = ['month', 'week', 'day'];
      const selectedView = buttons[index] as ViewType;
      if (selectedView && selectedView !== viewType) {
        handleViewChange(selectedView);
      }
    },
  });

  // If we're on a day route, set the view to day
  useEffect(() => {
    if (date) {
      setViewType('day');
    }
  }, [date]);

  const handleViewChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    const label = getViewSwitcherLabel(newViewType, true);
    announce(`Switched to ${label}`);
    
    if (newViewType === 'day' && !date) {
      const today = format(new Date(), 'yyyy-MM-dd');
      navigate(`/day/${today}`);
    } else if (newViewType !== 'day') {
      navigate('/calendar');
    }
  };

  const handleDayClick = () => {
    handleViewChange('day');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 
          className="text-2xl font-semibold"
          id="calendar-title"
        >
          Food Tracker Calendar
        </h1>
        
        <nav 
          ref={containerRef as React.RefObject<HTMLElement>}
          role="tablist"
          aria-label="Calendar view switcher"
          aria-describedby="view-instructions"
          className="flex items-center space-x-2"
        >
          <Button
            role="tab"
            aria-selected={viewType === 'month'}
            aria-controls="calendar-content"
            aria-label={getViewSwitcherLabel('month', viewType === 'month')}
            variant={viewType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('month')}
            tabIndex={viewType === 'month' ? 0 : -1}
          >
            Month
          </Button>
          <Button
            role="tab"
            aria-selected={viewType === 'week'}
            aria-controls="calendar-content"
            aria-label={getViewSwitcherLabel('week', viewType === 'week')}
            variant={viewType === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('week')}
            tabIndex={viewType === 'week' ? 0 : -1}
          >
            Week
          </Button>
          <Button
            role="tab"
            aria-selected={viewType === 'day'}
            aria-controls="calendar-content"
            aria-label={getViewSwitcherLabel('day', viewType === 'day')}
            variant={viewType === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={handleDayClick}
            tabIndex={viewType === 'day' ? 0 : -1}
          >
            Day
          </Button>
        </nav>
        
        <div id="view-instructions" className="sr-only">
          Use arrow keys to navigate between view options, Enter or Space to select
        </div>
      </header>

      <main 
        id="calendar-content"
        role="tabpanel"
        aria-labelledby="calendar-title"
        aria-live="polite"
        aria-atomic="false"
      >
        {viewType === 'month' && <MonthView />}
        {viewType === 'week' && <WeekView />}
        {viewType === 'day' && date && <DayView />}
      </main>

      {/* Live region for announcements */}
      {createLiveRegion()}
    </div>
  );
};

export default CalendarView;