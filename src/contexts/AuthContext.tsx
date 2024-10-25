import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, plan: 'trial' | 'lifetime') => Promise<void>;
  updateUserData?: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateUserData = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...data,
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get existing LIFX token if available
      const lifxToken = localStorage.getItem('lifx_token');

      // For preview/testing, allow any login
      const mockUser: User = {
        email,
        plan: 'lifetime',
        isAdmin: email === 'info@n00d.com',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        selectedDevices: [],
        lifxToken: lifxToken || null // Include existing LIFX token
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, plan: 'trial' | 'lifetime') => {
    setIsLoading(true);
    try {
      // Get existing LIFX token if available
      const lifxToken = localStorage.getItem('lifx_token');

      // For preview/testing, create user immediately
      const newUser: User = {
        email,
        plan,
        isAdmin: email === 'info@n00d.com',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        selectedDevices: [],
        lifxToken: lifxToken || null // Include existing LIFX token
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    // Don't remove LIFX token on logout to persist it across sessions
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    isLoading,
    login,
    logout,
    signup,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}