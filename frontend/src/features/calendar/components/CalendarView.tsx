import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import MonthViewVirtualized from './MonthViewVirtualized';
import WeekView from './WeekView';
import DayView from './DayView';
import { features } from '@/config/features';

type ViewType = 'month' | 'week' | 'day';

const CalendarView: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('month');
  const navigate = useNavigate();
  const { date } = useParams<{ date?: string }>();

  // If we're on a day route, set the view to day
  useEffect(() => {
    if (date) {
      setViewType('day');
    }
  }, [date]);

  const handleDayClick = () => {
    setViewType('day');
    // Navigate to the day view with today's date if not already on a date
    if (!date) {
      const today = format(new Date(), 'yyyy-MM-dd');
      navigate(`/day/${today}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Food Tracker Calendar</h1>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewType('month');
              navigate('/calendar');
            }}
          >
            Month
          </Button>
          <Button
            variant={viewType === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewType('week');
              navigate('/calendar');
            }}
          >
            Week
          </Button>
          <Button
            variant={viewType === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={handleDayClick}
          >
            Day
          </Button>
        </div>
      </div>

      {viewType === 'month' && (features.virtualizedCalendar ? <MonthViewVirtualized /> : <MonthView />)}
      {viewType === 'week' && <WeekView />}
      {viewType === 'day' && date && <DayView />}
    </div>
  );
};

export default CalendarView;