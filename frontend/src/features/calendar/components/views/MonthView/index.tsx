import React, { useState } from 'react';
import MonthGrid from './MonthGrid';
import MonthSummary from './MonthSummary';
import { useCalendarData } from '@/features/calendar/hooks/useCalendarData';
import CreateMealModal from '@/features/meals/components/CreateMealModal';
import { format } from 'date-fns';

export const MonthView: React.FC = () => {
  const [isCreateMealModalOpen, setIsCreateMealModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { data } = useCalendarData();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsCreateMealModalOpen(true);
  };

  if (!data) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Month Summary Statistics */}
        {data.summary && <MonthSummary summary={data.summary} />}
        
        {/* Calendar Grid */}
        <MonthGrid 
          monthData={data}
          onDateSelect={handleDateSelect}
        />
      </div>
      
      <CreateMealModal
        open={isCreateMealModalOpen}
        onOpenChange={setIsCreateMealModalOpen}
        defaultDate={selectedDate}
      />
    </>
  );
};

export default MonthView;
