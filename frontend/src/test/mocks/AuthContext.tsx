import React, { createContext, useContext, ReactNode } from 'react';
import { vi } from 'vitest';

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

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: ReactNode; user?: User | null }> = ({ 
  children, 
  user = null 
}) => {
  const mockValue: AuthContextType = {
    user,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    isAuthenticated: !!user,
  };

  return (
    <MockAuthContext.Provider value={mockValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};