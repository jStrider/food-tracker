import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * Component that redirects from the home page to today's daily view
 */
const HomeRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get today's date in yyyy-MM-dd format
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Redirect to today's daily view
    navigate(`/day/${today}`, { replace: true });
  }, [navigate]);

  // Show a loading state while redirecting
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default HomeRedirect;