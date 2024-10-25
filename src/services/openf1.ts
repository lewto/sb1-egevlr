import axios from 'axios';

const API_URL = 'https://api.openf1.org/v1';
const CACHE_DURATION = 2000; // 2 seconds cache
let lastTrackStatus: any = null;
let lastTrackStatusTime: number = 0;

interface TrackStatus {
  status: number;
  timestamp: string;
}

export const getTrackStatus = async (): Promise<TrackStatus> => {
  const now = Date.now();
  
  // Return cached data if within cache duration
  if (lastTrackStatus && (now - lastTrackStatusTime) < CACHE_DURATION) {
    return lastTrackStatus;
  }

  try {
    const response = await axios.get(`${API_URL}/track_status`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RaceRGB/1.0'
      }
    });

    // Cache the result
    lastTrackStatus = response.data[0] || { status: 1 }; // Default to green flag
    lastTrackStatusTime = now;

    return lastTrackStatus;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few seconds.');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('OpenF1 API request timed out');
      }
      throw new Error(`Failed to fetch track status: ${error.message}`);
    }
    throw error;
  }
};

let sessionCache: boolean | null = null;
let sessionCacheTime: number = 0;
const SESSION_CACHE_DURATION = 30000; // 30 seconds cache

export const isRaceSessionActive = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Return cached data if within cache duration
  if (sessionCache !== null && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
    return sessionCache;
  }

  try {
    const response = await axios.get(`${API_URL}/session`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RaceRGB/1.0'
      }
    });

    // Cache the result
    sessionCache = response.data.length > 0;
    sessionCacheTime = now;

    return sessionCache;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few seconds.');
      }
      console.error('Error checking session status:', error);
      // Return last known state if available, otherwise assume no session
      return sessionCache ?? false;
    }
    return false;
  }
};

export const translateStatus = (status: number): string => {
  switch (status) {
    case 1:
      return 'green';
    case 2:
      return 'yellow';
    case 3:
      return 'checkered';
    case 4:
      return 'safety';
    case 5:
      return 'red';
    case 6:
      return 'safety'; // Virtual Safety Car
    default:
      return 'green';
  }
};