import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
  title: string;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onAddMeal?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  showAddButton?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  title,
  onNavigatePrevious,
  onNavigateNext,
  onAddMeal,
  previousLabel,
  nextLabel,
  showAddButton = true,
}) => {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center space-x-4" role="group" aria-label="Calendar navigation">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigatePrevious}
          aria-label={previousLabel}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h1 
          className="text-2xl font-semibold"
          aria-live="polite"
          aria-atomic="true"
        >
          {title}
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigateNext}
          aria-label={nextLabel}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      
      {showAddButton && onAddMeal && (
        <>
          <Button 
            onClick={onAddMeal}
            aria-describedby="add-meal-description"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Meal
          </Button>
          <div id="add-meal-description" className="sr-only">
            Add a new meal for today's date
          </div>
        </>
      )}
    </header>
  );
};

export default CalendarHeader;