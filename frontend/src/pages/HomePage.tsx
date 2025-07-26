import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to today's day view
    const today = format(new Date(), 'yyyy-MM-dd');
    navigate(`/day/${today}`);
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default HomePage;