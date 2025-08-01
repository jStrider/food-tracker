import React from 'react';
import CalendarContainer from './CalendarContainer';

/**
 * Main calendar view component that handles routing and view management.
 * This component now delegates all functionality to CalendarContainer
 * which manages the calendar context and state.
 */
const CalendarView: React.FC = () => {
  return <CalendarContainer />;
};

export default CalendarView;