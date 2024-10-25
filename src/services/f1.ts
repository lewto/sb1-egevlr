import axios from 'axios';
import { F1Response, Race } from '../types/f1';

const BASE_URL = 'https://ergast.com/api/f1';

export const getF1Schedule = async (year: number = new Date().getFullYear()): Promise<Race[]> => {
  try {
    const response = await axios.get<F1Response>(`${BASE_URL}/${year}.json`);
    
    if (!response.data?.MRData?.RaceTable?.Races) {
      throw new Error('Invalid API response format');
    }

    return response.data.MRData.RaceTable.Races;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch F1 schedule: ${error.message}`);
    }
    throw error;
  }
};