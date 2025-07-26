import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import WeekView from './WeekView';

type ViewType = 'month' | 'week' | 'day';

const CalendarView: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('month');
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Food Tracker Calendar</h1>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('month')}
          >
            Month
          </Button>
          <Button
            variant={viewType === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('week')}
          >
            Week
          </Button>
          <Button
            variant={viewType === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              // When switching to day view, navigate to today's date
              const today = format(new Date(), 'yyyy-MM-dd');
              navigate(`/day/${today}`);
            }}
          >
            Day
          </Button>
        </div>
      </div>

      {viewType === 'month' && <MonthView />}
      {viewType === 'week' && <WeekView />}
    </div>
  );
};

export default CalendarView;