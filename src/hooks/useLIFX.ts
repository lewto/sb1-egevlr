import { useState, useEffect, useCallback } from 'react';
import { lifxService } from '../services/lifx';
import { LIFXDevice } from '../types/lifx';
import { useAuth } from '../contexts/AuthContext';

export const useLIFX = () => {
  const { user, updateUserData } = useAuth();
  const [devices, setDevices] = useState<LIFXDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(() => {
    return new Set(user?.selectedDevices || []);
  });
  const [broadcastDelay, setBroadcastDelay] = useState<number>(() => {
    return user?.broadcastDelay || 5;
  });

  const fetchDevices = useCallback(async () => {
    if (!lifxService.getToken()) {
      setLoading(false);
      setIsConnected(false);
      return;
    }

    try {
      const fetchedDevices = await lifxService.getLights();
      setDevices(fetchedDevices);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to LIFX';
      setError(errorMessage);
      setIsConnected(false);
      setDevices([]);
      
      // If token is invalid, clear it
      if (errorMessage.includes('Invalid LIFX API token')) {
        lifxService.disconnect();
        localStorage.removeItem('lifx_token');
        if (updateUserData) {
          await updateUserData({ lifxToken: null });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [updateUserData]);

  const initialize = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      lifxService.setToken(token);
      localStorage.setItem('lifx_token', token);
      if (updateUserData) {
        await updateUserData({ lifxToken: token });
      }
      await fetchDevices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize LIFX connection';
      setError(errorMessage);
      setIsConnected(false);
      lifxService.disconnect();
      localStorage.removeItem('lifx_token');
      if (updateUserData) {
        await updateUserData({ lifxToken: null });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchDevices, updateUserData]);

  const toggleDevice = useCallback(async (deviceId: string) => {
    const newSelectedDevices = new Set(selectedDevices);
    if (newSelectedDevices.has(deviceId)) {
      newSelectedDevices.delete(deviceId);
    } else {
      newSelectedDevices.add(deviceId);
    }
    setSelectedDevices(newSelectedDevices);
    
    if (updateUserData) {
      await updateUserData({ 
        selectedDevices: Array.from(newSelectedDevices) 
      });
    }
  }, [selectedDevices, updateUserData]);

  const updateBroadcastDelay = useCallback(async (delay: number) => {
    setBroadcastDelay(delay);
    if (updateUserData) {
      await updateUserData({
        broadcastDelay: delay
      });
    }
  }, [updateUserData]);

  const setFlag = useCallback(async (flagType: 'green' | 'yellow' | 'red' | 'safety' | 'checkered') => {
    if (!isConnected || selectedDevices.size === 0) return;

    setError(null);
    try {
      const selector = Array.from(selectedDevices).join(',');
      
      switch (flagType) {
        case 'red':
          await lifxService.setRedFlag(selector);
          break;
        case 'safety':
          await lifxService.setSafetyCarFlag(selector);
          break;
        case 'checkered':
          await lifxService.setCheckeredFlag(selector);
          break;
        default:
          await lifxService.setState(selector, {
            power: 'on',
            color: getFlagColor(flagType),
            brightness: 1,
            duration: 0.1
          });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set flag';
      setError(errorMessage);
      
      // If token becomes invalid during operation, disconnect
      if (errorMessage.includes('Invalid LIFX API token')) {
        lifxService.disconnect();
        localStorage.removeItem('lifx_token');
        if (updateUserData) {
          await updateUserData({ lifxToken: null });
        }
        setIsConnected(false);
      }
    }
  }, [selectedDevices, isConnected, updateUserData]);

  const disconnect = useCallback(async () => {
    localStorage.removeItem('lifx_token');
    if (updateUserData) {
      await updateUserData({ 
        lifxToken: null, 
        selectedDevices: [] 
      });
    }
    setIsConnected(false);
    setDevices([]);
    setSelectedDevices(new Set());
    setError(null);
    lifxService.disconnect();
  }, [updateUserData]);

  // Initialize LIFX service with saved token
  useEffect(() => {
    let mounted = true;
    const token = user?.lifxToken || localStorage.getItem('lifx_token');
    
    if (token && !isConnected && !loading) {
      setLoading(true);
      initialize(token).finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [initialize, user?.lifxToken, isConnected, loading]);

  // Refresh devices periodically when connected
  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    if (isConnected) {
      interval = setInterval(() => {
        if (!loading) {
          fetchDevices().finally(() => {
            if (mounted) {
              setLoading(false);
            }
          });
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, fetchDevices, loading]);

  return {
    devices,
    loading,
    error,
    isConnected,
    initialize,
    setFlag,
    selectedDevices,
    toggleDevice,
    disconnect,
    broadcastDelay,
    setBroadcastDelay: updateBroadcastDelay
  };
};

const getFlagColor = (flagType: string) => {
  switch (flagType) {
    case 'green':
      return { hue: 120, saturation: 1, kelvin: 3500 };
    case 'yellow':
      return { hue: 60, saturation: 1, kelvin: 3500 };
    case 'red':
      return { hue: 0, saturation: 1, kelvin: 3500 };
    case 'safety':
      return { hue: 60, saturation: 1, kelvin: 3500 };
    case 'checkered':
      return { hue: 0, saturation: 0, kelvin: 3500 };
    default:
      return { hue: 0, saturation: 0, kelvin: 3500 };
  }
};

export default useLIFX;