import { useState, useEffect, useCallback } from 'react';
import { getTrackStatus, translateStatus, isRaceSessionActive } from '../services/openf1';
import { useLIFX } from './useLIFX';
import { delayService } from '../services/delayService';

export const useTrackStatus = () => {
  const { setFlag, isConnected, selectedDevices } = useLIFX();
  const [status, setStatus] = useState<string>('green');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFlag, setPendingFlag] = useState<string | null>(null);

  const updateFlag = useCallback(async (newStatus: string) => {
    if (!isConnected || selectedDevices.size === 0) return;

    // Queue the flag change with the broadcast delay
    delayService.queueAction('flag', async () => {
      try {
        await setFlag(newStatus as any);
        setPendingFlag(null);
      } catch (err) {
        console.error('Failed to set flag:', err);
        setError('Failed to update lights');
      }
    });

    // Update UI immediately to show pending change
    setPendingFlag(newStatus);
  }, [isConnected, selectedDevices, setFlag]);

  const fetchStatus = useCallback(async () => {
    try {
      const trackStatus = await getTrackStatus();
      const newStatus = translateStatus(trackStatus.status);
      
      if (newStatus !== status) {
        setStatus(newStatus);
        setLastUpdate(new Date());
        await updateFlag(newStatus);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch track status';
      // Only update error if it's different to avoid UI flicker
      setError(prev => prev !== errorMessage ? errorMessage : prev);
    }
  }, [status, updateFlag]);

  const checkSession = useCallback(async () => {
    try {
      const active = await isRaceSessionActive();
      setIsLive(active);
      return active;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check race session';
      setError(prev => prev !== errorMessage ? errorMessage : prev);
      return false;
    }
  }, []);

  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    let sessionInterval: NodeJS.Timeout | null = null;

    const initializeTracking = async () => {
      const active = await checkSession();
      if (active) {
        await fetchStatus();
        statusInterval = setInterval(fetchStatus, 2000); // Check every 2 seconds
      }
    };

    initializeTracking();
    sessionInterval = setInterval(checkSession, 30000); // Check session every 30 seconds

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, [checkSession, fetchStatus]);

  return {
    status,
    lastUpdate,
    isLive,
    error,
    pendingFlag
  };
};

export default useTrackStatus;