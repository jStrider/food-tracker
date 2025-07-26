import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import CalendarView from '@/features/calendar/components/CalendarView';
import DayView from '@/features/calendar/components/DayView';
import WeekView from '@/features/calendar/components/WeekView';
import FoodSearch from '@/features/foods/components/FoodSearch';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/day/:date" element={<DayView />} />
              <Route path="/week/:date?" element={<WeekView />} />
              <Route path="/foods" element={<FoodSearch />} />
            </Routes>
          </Layout>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;