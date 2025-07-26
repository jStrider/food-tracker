import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import WeekView from './WeekView';

type ViewType = 'month' | 'week';

const CalendarView: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('month');

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
        </div>
      </div>

      {viewType === 'month' && <MonthView />}
      {viewType === 'week' && <WeekView />}
    </div>
  );
};

export default CalendarView;