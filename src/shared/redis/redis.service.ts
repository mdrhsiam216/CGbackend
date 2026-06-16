import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

export interface LocationData {
  caregiverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logTag = 'RedisService';

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  /**
   * Cache caregiver location for a booking
   * @param bookingId - Booking ID
   * @param locationData - Location data to cache
   * @param ttlSeconds - Time to live in seconds (default: 24 hours)
   */
  async cacheLocation(
    bookingId: string,
    locationData: LocationData,
    ttlSeconds: number = 86400, // 24 hours
  ): Promise<void> {
    const key = `location:booking:${bookingId}`;
    const value = JSON.stringify(locationData);

    await this.client.setex(key, ttlSeconds, value);
  }

  /**
   * Get cached caregiver location for a booking
   * @param bookingId - Booking ID
   * @returns Location data or null if not found
   */
  async getLocation(bookingId: string): Promise<LocationData | null> {
    const key = `location:booking:${bookingId}`;
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as LocationData;
    } catch (error) {
      console.error(`[${this.logTag}] Error parsing location data:`, error);
      return null;
    }
  }

  /**
   * Delete cached location for a booking
   * @param bookingId - Booking ID
   */
  async deleteLocation(bookingId: string): Promise<void> {
    const key = `location:booking:${bookingId}`;
    await this.client.del(key);
  }

  /**
   * Check if location exists in cache
   * @param bookingId - Booking ID
   * @returns true if location exists
   */
  async locationExists(bookingId: string): Promise<boolean> {
    const key = `location:booking:${bookingId}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  /**
   * Get Redis client (for advanced operations if needed)
   */
  getClient(): Redis {
    return this.client;
  }
}
