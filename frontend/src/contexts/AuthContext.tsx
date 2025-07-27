import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Create a promise to track ongoing refresh attempts
let refreshPromise: Promise<string | null> | null = null;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const authContextRef = useRef<AuthContextType | null>(null);

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<string | null> => {
    // If there's already a refresh in progress, wait for it
    if (refreshPromise) {
      return refreshPromise;
    }

    // Create a new refresh promise
    refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', newRefreshToken);

        return access_token;
      } catch (error) {
        // Clear tokens and user on refresh failure
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        return null;
      } finally {
        // Clear the refresh promise
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add token
    const requestInterceptor = axios.interceptors.request.use(
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

    // Response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Check if error is 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh the token
          const newToken = await authContextRef.current?.refreshAccessToken();
          
          if (newToken) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          // If the token is invalid, try to refresh
          const newToken = await refreshAccessToken();
          if (newToken) {
            try {
              const response = await axios.get('/auth/me');
              setUser(response.data);
            } catch {
              // Clear tokens if refresh also failed
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      // Store both tokens
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      setUser(user);
      
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
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
      const { access_token, refresh_token, user } = response.data;
      
      // Store both tokens
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
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

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      await axios.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshAccessToken,
  };

  // Store context value in ref for interceptor access
  authContextRef.current = contextValue;

  return (
    <AuthContext.Provider value={contextValue}>
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