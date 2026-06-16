import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const createRedisConfig = (
  configService: ConfigService,
): RedisOptions => {
  const redisUrl = configService.get<string>('REDIS_URL');

  const baseConfig: Partial<RedisOptions> = {
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  };

  // Use REDIS_URL if provided (for Railway, Heroku, etc.)
  if (redisUrl?.trim()) {
    try {
      const { hostname, port, password, username } = new URL(redisUrl);

      return {
        ...baseConfig,
        host: hostname,
        port: parseInt(port) || 6379,
        ...(password && { password }),
        ...(username && username !== 'default' && { username }),
      } as RedisOptions;
    } catch (error) {
      console.error('[RedisConfig] Failed to parse REDIS_URL:', error);
      // Fallback to URL-based connection
      return { ...baseConfig, url: redisUrl } as RedisOptions;
    }
  }

  // Fall back to individual environment variables
  return {
    ...baseConfig,
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    ...(configService.get<string>('REDIS_PASSWORD') && {
      password: configService.get<string>('REDIS_PASSWORD'),
    }),
  } as RedisOptions;
};
