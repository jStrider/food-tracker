import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CalendarView from '@/features/calendar/components/CalendarView';
import WeekView from '@/features/calendar/components/WeekView';
import FoodSearch from '@/features/foods/components/FoodSearch';
// TODO: Re-enable when init-default endpoint is restored or replaced with proper auth flow
// import { initializeApp } from '@/utils/initializeApp';
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
  useEffect(() => {
    // Initialize app on mount
    // TODO: Re-enable when init-default endpoint is restored or replaced with proper auth flow
    // initializeApp().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route element={<Layout />}>
                <Route path="/" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <CalendarView />
                  </ProtectedRoute>
                } />
                <Route path="/day/:date" element={
                  <ProtectedRoute>
                    <CalendarView />
                  </ProtectedRoute>
                } />
                <Route path="/week/:date?" element={
                  <ProtectedRoute>
                    <WeekView />
                  </ProtectedRoute>
                } />
                <Route path="/foods" element={
                  <ProtectedRoute>
                    <FoodSearch />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;