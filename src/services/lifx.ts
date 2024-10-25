import axios, { AxiosError } from 'axios';
import { LIFXDevice, LIFXState } from '../types/lifx';

const LIFX_API_URL = 'https://api.lifx.com/v1';

class LIFXService {
  private token: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private isInitialized: boolean = false;

  setToken(token: string) {
    if (!token) {
      throw new Error('LIFX API token is required');
    }
    this.token = token;
    this.retryCount = 0;
    this.isInitialized = true;
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders() {
    if (!this.token) {
      throw new Error('LIFX service not initialized');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleRetry<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('LIFX service not initialized');
    }

    try {
      return await operation();
    } catch (error) {
      if (error instanceof AxiosError) {
        // Network errors
        if (!error.response) {
          throw new Error('Unable to connect to LIFX. Please check your internet connection.');
        }

        // Auth errors
        if (error.response.status === 401) {
          this.disconnect();
          throw new Error('Invalid LIFX API token');
        }

        // Rate limiting
        if (error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few seconds.');
        }

        // Server errors - retry
        if (error.response.status >= 500 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
          return this.handleRetry(operation);
        }

        // Other errors
        throw new Error(error.response.data?.message || 'Failed to communicate with LIFX');
      }
      throw error;
    }
  }

  async getLights(): Promise<LIFXDevice[]> {
    try {
      const response = await this.handleRetry(() => 
        axios.get(`${LIFX_API_URL}/lights/all`, {
          headers: this.getHeaders(),
          timeout: 10000
        })
      );
      this.retryCount = 0;
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async setState(selector: string, state: LIFXState): Promise<void> {
    try {
      await this.handleRetry(() =>
        axios.put(
          `${LIFX_API_URL}/lights/${selector}/state`,
          state,
          { 
            headers: this.getHeaders(),
            timeout: 10000
          }
        )
      );
      this.retryCount = 0;
    } catch (error) {
      throw error;
    }
  }

  async setRedFlag(selector: string): Promise<void> {
    try {
      await this.handleRetry(() =>
        axios.post(
          `${LIFX_API_URL}/lights/${selector}/effects/pulse`,
          {
            color: { hue: 0, saturation: 1, brightness: 1, kelvin: 3500 },
            from_color: { hue: 0, saturation: 1, brightness: 0.3, kelvin: 3500 },
            period: 0.5,
            cycles: 6,
            power_on: true
          },
          { headers: this.getHeaders() }
        )
      );

      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.setState(selector, {
        power: 'on',
        color: { hue: 0, saturation: 1, kelvin: 3500 },
        brightness: 1
      });
    } catch (error) {
      throw error;
    }
  }

  async setSafetyCarFlag(selector: string): Promise<void> {
    try {
      await this.handleRetry(() =>
        axios.post(
          `${LIFX_API_URL}/lights/${selector}/effects/pulse`,
          {
            color: { hue: 60, saturation: 1, brightness: 1, kelvin: 3500 },
            from_color: { hue: 60, saturation: 1, brightness: 0.3, kelvin: 3500 },
            period: 0.5,
            cycles: 6,
            power_on: true
          },
          { headers: this.getHeaders() }
        )
      );

      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.setState(selector, {
        power: 'on',
        color: { hue: 60, saturation: 1, kelvin: 3500 },
        brightness: 1
      });
    } catch (error) {
      throw error;
    }
  }

  async setCheckeredFlag(selector: string): Promise<void> {
    try {
      await this.handleRetry(() =>
        axios.post(
          `${LIFX_API_URL}/lights/${selector}/effects/pulse`,
          {
            color: { hue: 0, saturation: 0, brightness: 1, kelvin: 9000 },
            from_color: { hue: 0, saturation: 0, brightness: 0, kelvin: 2500 },
            period: 0.3,
            cycles: 10,
            power_on: true
          },
          { headers: this.getHeaders() }
        )
      );

      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.setState(selector, {
        power: 'on',
        color: { hue: 120, saturation: 1, kelvin: 3500 },
        brightness: 1
      });
    } catch (error) {
      throw error;
    }
  }

  disconnect() {
    this.token = null;
    this.isInitialized = false;
    this.retryCount = 0;
  }
}

export const lifxService = new LIFXService();