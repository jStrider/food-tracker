import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  timezone?: string;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, timezone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add token to requests if it exists
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on mount
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounted
    
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Add retry logic for rate limiting
          let retries = 3;
          let response;
          
          while (retries > 0) {
            try {
              response = await axios.get('/auth/me');
              break;
            } catch (error: any) {
              if (error.response?.status === 429 && retries > 1) {
                // Rate limited, wait and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
                continue;
              }
              throw error;
            }
          }
          
          if (isMounted && response) {
            setUser(response.data);
          }
        } catch (error: any) {
          console.warn('Auth check failed:', error.response?.status, error.message);
          if (isMounted) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Add retry logic for rate limiting
      let retries = 3;
      let response;
      
      while (retries > 0) {
        try {
          response = await axios.post('/auth/login', { email, password });
          break;
        } catch (error: any) {
          if (error.response?.status === 429 && retries > 1) {
            // Rate limited, wait and retry
            toast({
              title: 'Rate limited',
              description: `Too many requests, retrying in 3 seconds... (${retries - 1} attempts left)`,
              variant: 'destructive',
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            retries--;
            continue;
          }
          throw error;
        }
      }
      
      if (response) {
        const { access_token, user } = response.data;
        
        localStorage.setItem('token', access_token);
        setUser(user);
        
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to login',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string, timezone?: string) => {
    try {
      const response = await axios.post('/auth/register', { 
        email, 
        name, 
        password,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(user);
      
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: 'Success',
      description: 'Logged out successfully',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};