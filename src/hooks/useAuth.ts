import { useState, useEffect, useCallback } from 'react';
import { deviceFingerprint } from '../services/deviceFingerprint';
import { lifxService } from '../services/lifx';

interface User {
  email: string;
  plan: 'trial' | 'lifetime';
  isAdmin?: boolean;
  trialStart?: string;
  lifxToken?: string | null;
  selectedDevices?: string[];
  createdAt: string;
  lastLogin: string;
  trialExpires?: string;
  deviceFingerprint?: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check trial status
  const checkTrialStatus = useCallback((user: User): boolean => {
    if (user.plan !== 'trial') return true;
    if (!user.trialExpires) return false;

    const now = new Date();
    const trialEnd = new Date(user.trialExpires);
    return now < trialEnd;
  }, []);

  // Initialize LIFX service with saved token
  const initializeLIFX = useCallback((token: string) => {
    lifxService.setToken(token);
    localStorage.setItem('lifx_token', token);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      const lifxToken = localStorage.getItem('lifx_token');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Check if trial is still valid
          if (parsedUser.plan === 'trial' && !checkTrialStatus(parsedUser)) {
            // Trial expired - remove auth
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // If we have a LIFX token, initialize the service
            if (lifxToken) {
              initializeLIFX(lifxToken);
              // Update user with LIFX token if not present
              if (!parsedUser.lifxToken) {
                parsedUser.lifxToken = lifxToken;
                localStorage.setItem('user', JSON.stringify(parsedUser));
              }
            }
            setUser(parsedUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [checkTrialStatus, initializeLIFX]);

  const signup = useCallback(async (email: string, password: string, plan: 'trial' | 'lifetime') => {
    try {
      // Check for existing trial
      if (plan === 'trial' && await deviceFingerprint.hasExistingTrial()) {
        throw new Error('A trial has already been used on this device');
      }

      // Get device fingerprint
      const fingerprint = await deviceFingerprint.getFingerprint();

      // Calculate trial expiration (next Monday if trial)
      const trialExpires = plan === 'trial' ? getNextMonday() : undefined;

      // Get existing LIFX token if available
      const lifxToken = localStorage.getItem('lifx_token');

      const newUser: User = {
        email,
        plan,
        isAdmin: email === 'info@n00d.com',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        selectedDevices: [],
        lifxToken,
        trialExpires,
        deviceFingerprint: fingerprint
      };
      
      if (plan === 'trial') {
        await deviceFingerprint.recordTrial(email);
      }

      const token = 'session_' + Date.now();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demo, check if this email has a trial record
      const trials = JSON.parse(localStorage.getItem('trial_devices') || '{}');
      const hasExistingTrial = Object.values(trials).some((trial: any) => trial.email === email);

      // Get device fingerprint
      const fingerprint = await deviceFingerprint.getFingerprint();

      // Get existing LIFX token if available
      const lifxToken = localStorage.getItem('lifx_token');

      const mockUser: User = {
        email,
        plan: 'lifetime',
        isAdmin: email === 'info@n00d.com',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        selectedDevices: [],
        lifxToken,
        deviceFingerprint: fingerprint
      };
      
      const token = 'session_' + Date.now();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Initialize LIFX if we have a token
      if (lifxToken) {
        initializeLIFX(lifxToken);
      }
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      return mockUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password');
    }
  }, [initializeLIFX]);

  const updateUserData = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...data,
    };
    
    // If updating LIFX token, initialize the service
    if (data.lifxToken) {
      initializeLIFX(data.lifxToken);
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user, initializeLIFX]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Don't remove LIFX token on logout to persist it across sessions
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    user,
    isAdmin: user?.isAdmin || false,
    isLoading,
    login,
    signup,
    logout,
    updateUserData,
    isTrialValid: user ? checkTrialStatus(user) : false
  };
};

// Helper function to get next Monday's date
function getNextMonday(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 1 : 8 - day; // If Sunday, add 1 day, otherwise add days until next Monday
  date.setDate(date.getDate() + diff);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export default useAuth;