import { useState, useEffect } from 'react';
import { Race } from '../types/f1';
import { getF1Schedule } from '../services/f1';
import { format, parseISO, isAfter } from 'date-fns';

export const useF1Schedule = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getF1Schedule();
        
        if (mounted) {
          setRaces(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load F1 schedule');
          console.error('Error fetching F1 schedule:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSchedule();

    return () => {
      mounted = false;
    };
  }, []);

  const getNextRace = () => {
    if (!races.length) return null;
    
    const now = new Date();
    return races.find(race => {
      const raceDate = parseISO(`${race.date}T${race.time}`);
      return isAfter(raceDate, now);
    });
  };

  const formatRaceDateTime = (date: string, time: string) => {
    const dateTime = parseISO(`${date}T${time}`);
    return format(dateTime, 'MMM d, yyyy - h:mm a');
  };

  return {
    races,
    loading,
    error,
    getNextRace,
    formatRaceDateTime,
  };
};